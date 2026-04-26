import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupDB, teardownDB, resetDB,
  callProcOne, callProc, createTestUser, createTestTeam, getPool,
} from '../helpers.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(resetDB);

describe('create_player_on_team', () => {
  it('creates a player and roster entry', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);

    const row = await callProcOne<{
      out_player_id: string;
      out_name: string;
      out_number: number;
      out_roster_entry_id: string;
    }>('create_player_on_team', [teamId, 'Alice', 7, userId]);

    expect(row.out_player_id).toBeDefined();
    expect(row.out_name).toBe('Alice');
    expect(row.out_number).toBe(7);
    expect(row.out_roster_entry_id).toBeDefined();
  });

  it('rejects non-coach', async () => {
    const coach = await createTestUser('coach', 'coach@test.com');
    const parent = await createTestUser('parent', 'parent@test.com');
    const teamId = await createTestTeam(coach);

    await callProcOne('add_team_member', [teamId, parent, 'parent', coach]);

    await expect(
      callProcOne('create_player_on_team', [teamId, 'Bob', null, parent]),
    ).rejects.toThrow(/Unauthorized/);
  });
});

describe('remove_player_from_team', () => {
  it('removes a player from the roster', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);
    const player = await callProcOne<{ out_player_id: string }>(
      'create_player_on_team',
      [teamId, 'Alice', null, userId],
    );

    const result = await callProcOne<{ remove_player_from_team: boolean }>(
      'remove_player_from_team',
      [player.out_player_id, teamId, userId],
    );
    expect(result.remove_player_from_team).toBe(true);

    const players = await callProc('get_team_players', [teamId, userId]);
    expect(players).toHaveLength(0);
  });

  it('throws when roster entry does not exist', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);

    await expect(
      callProcOne('remove_player_from_team', [
        '00000000-0000-0000-0000-000000000000',
        teamId,
        userId,
      ]),
    ).rejects.toThrow(/not found/i);
  });

  it('soft-deletes: roster_entry row still exists with removed_at set', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);
    const player = await callProcOne<{ out_player_id: string; out_roster_entry_id: string }>(
      'create_player_on_team',
      [teamId, 'Alice', null, userId],
    );

    await callProcOne('remove_player_from_team', [player.out_player_id, teamId, userId]);

    const { rows } = await getPool().query(
      'SELECT removed_at FROM roster_entries WHERE id = $1',
      [player.out_roster_entry_id],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].removed_at).not.toBeNull();
  });

  it('does not affect lineup JSONB when player is removed', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);
    const player = await callProcOne<{ out_player_id: string }>(
      'create_player_on_team',
      [teamId, 'Alice', null, userId],
    );

    const lineup = await callProcOne<{ id: string }>(
      'save_lineup',
      [
        null, teamId, userId,
        JSON.stringify({ opponent: 'Mets' }),
        JSON.stringify([player.out_player_id]),
        JSON.stringify([player.out_player_id]),
        JSON.stringify([{ positions: { pitcher: player.out_player_id }, fieldConfig: {} }]),
        'published',
      ],
    );

    await callProcOne('remove_player_from_team', [player.out_player_id, teamId, userId]);

    const after = await callProcOne<{
      available_player_ids: string[];
      batting_order: string[];
      innings: Array<{ positions: Record<string, string> }>;
    }>('get_lineup', [lineup.id, userId]);

    expect(after.available_player_ids).toContain(player.out_player_id);
    expect(after.batting_order).toContain(player.out_player_id);
    expect(after.innings[0].positions.pitcher).toBe(player.out_player_id);
  });
});

describe('get_team_players_full', () => {
  it('returns active and removed players with removed_at field', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);

    await callProcOne('create_player_on_team', [teamId, 'Alice', 1, userId]);
    const bob = await callProcOne<{ out_player_id: string }>(
      'create_player_on_team',
      [teamId, 'Bob', 2, userId],
    );

    await callProcOne('remove_player_from_team', [bob.out_player_id, teamId, userId]);

    const all = await callProc<{ out_name: string; out_removed_at: string | null }>(
      'get_team_players_full',
      [teamId, userId],
    );

    expect(all).toHaveLength(2);
    const alice = all.find((p) => p.out_name === 'Alice');
    const bobRow = all.find((p) => p.out_name === 'Bob');
    expect(alice!.out_removed_at).toBeNull();
    expect(bobRow!.out_removed_at).not.toBeNull();
  });
});

describe('restore soft-deleted player', () => {
  it('re-adding a soft-deleted player restores the roster entry', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);
    const player = await callProcOne<{ out_player_id: string }>(
      'create_player_on_team',
      [teamId, 'Alice', 5, userId],
    );

    await callProcOne('remove_player_from_team', [player.out_player_id, teamId, userId]);

    const players = await callProc('get_team_players', [teamId, userId]);
    expect(players).toHaveLength(0);

    await callProcOne('add_player_to_team', [player.out_player_id, teamId, 9, userId]);

    const restored = await callProc<{ out_name: string; out_number: number }>(
      'get_team_players',
      [teamId, userId],
    );
    expect(restored).toHaveLength(1);
    expect(restored[0].out_name).toBe('Alice');
    expect(restored[0].out_number).toBe(9);
  });
});

describe('get_team_players', () => {
  it('returns players ordered by number then name', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);

    await callProcOne('create_player_on_team', [teamId, 'Zoe', 1, userId]);
    await callProcOne('create_player_on_team', [teamId, 'Alice', 3, userId]);
    await callProcOne('create_player_on_team', [teamId, 'Bob', null, userId]);

    const players = await callProc<{ out_name: string; out_number: number | null }>(
      'get_team_players',
      [teamId, userId],
    );

    expect(players[0].out_name).toBe('Zoe');
    expect(players[0].out_number).toBe(1);
    expect(players[1].out_name).toBe('Alice');
    expect(players[2].out_name).toBe('Bob');
    expect(players[2].out_number).toBeNull();
  });

  it('rejects non-member', async () => {
    const user1 = await createTestUser('u1', 'u1@test.com');
    const user2 = await createTestUser('u2', 'u2@test.com');
    const teamId = await createTestTeam(user1);

    await expect(
      callProc('get_team_players', [teamId, user2]),
    ).rejects.toThrow(/Unauthorized/);
  });
});
