import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupDB, teardownDB, resetDB,
  callProcOne, callProc, createTestUser, createTestTeam,
} from '../helpers.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(resetDB);

describe('save_lineup', () => {
  it('creates a new lineup with JSONB fields', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);

    const gameContext = JSON.stringify({ dateTime: '2026-03-15T18:00:00.000Z', opponent: 'Mets' });
    const availablePlayerIds = JSON.stringify(['p1', 'p2']);
    const battingOrder = JSON.stringify(['p2', 'p1']);
    const innings = JSON.stringify([
      {
        positions: { pitcher: 'p1' },
        fieldConfig: { 'center-field': true, 'center-left-field': false, 'center-right-field': false },
      },
    ]);

    const lineup = await callProcOne<{
      id: string;
      team_id: string;
      game_context: Record<string, unknown>;
      available_player_ids: string[];
      batting_order: string[];
      innings: Array<Record<string, unknown>>;
      status: string;
    }>('save_lineup', [null, teamId, userId, gameContext, availablePlayerIds, battingOrder, innings, 'draft']);

    expect(lineup.id).toBeDefined();
    expect(lineup.team_id).toBe(teamId);
    expect(lineup.status).toBe('draft');
    expect(lineup.game_context).toEqual({ dateTime: '2026-03-15T18:00:00.000Z', opponent: 'Mets' });
    expect(lineup.available_player_ids).toEqual(['p1', 'p2']);
    expect(lineup.batting_order).toEqual(['p2', 'p1']);
    expect(lineup.innings).toHaveLength(1);
    expect((lineup.innings[0] as Record<string, unknown>).positions).toEqual({ pitcher: 'p1' });
  });

  it('upserts an existing lineup by id', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);

    const first = await callProcOne<{ id: string; status: string }>(
      'save_lineup',
      [null, teamId, userId, '{}', '[]', '[]', '[]', 'draft'],
    );

    const updated = await callProcOne<{ id: string; status: string }>(
      'save_lineup',
      [first.id, teamId, userId, '{}', '[]', '[]', '[]', 'published'],
    );

    expect(updated.id).toBe(first.id);
    expect(updated.status).toBe('published');
  });

  it('rejects non-coach', async () => {
    const coach = await createTestUser('coach', 'coach@test.com');
    const parent = await createTestUser('parent', 'parent@test.com');
    const teamId = await createTestTeam(coach);
    await callProcOne('add_team_member', [teamId, parent, 'parent', coach]);

    await expect(
      callProcOne('save_lineup', [null, teamId, parent, '{}', '[]', '[]', '[]', 'draft']),
    ).rejects.toThrow(/Unauthorized/);
  });
});

describe('get_lineup', () => {
  it('returns lineup for team member', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);
    const created = await callProcOne<{ id: string }>(
      'save_lineup',
      [null, teamId, userId, '{}', '[]', '[]', '[]', 'draft'],
    );

    const lineup = await callProcOne<{ id: string; team_id: string }>(
      'get_lineup',
      [created.id, userId],
    );
    expect(lineup.id).toBe(created.id);
    expect(lineup.team_id).toBe(teamId);
  });

  it('throws for non-member', async () => {
    const user1 = await createTestUser('u1', 'u1@test.com');
    const user2 = await createTestUser('u2', 'u2@test.com');
    const teamId = await createTestTeam(user1);
    const created = await callProcOne<{ id: string }>(
      'save_lineup',
      [null, teamId, user1, '{}', '[]', '[]', '[]', 'draft'],
    );

    await expect(
      callProcOne('get_lineup', [created.id, user2]),
    ).rejects.toThrow(/Unauthorized/);
  });

  it('throws for non-existent lineup', async () => {
    const userId = await createTestUser();
    await expect(
      callProcOne('get_lineup', ['00000000-0000-0000-0000-000000000000', userId]),
    ).rejects.toThrow(/not found/i);
  });
});

describe('delete_lineup', () => {
  it('deletes an existing lineup', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);
    const created = await callProcOne<{ id: string }>(
      'save_lineup',
      [null, teamId, userId, '{}', '[]', '[]', '[]', 'draft'],
    );

    const result = await callProcOne<{ delete_lineup: boolean }>(
      'delete_lineup',
      [created.id, userId],
    );
    expect(result.delete_lineup).toBe(true);

    const remaining = await callProc('get_team_lineups', [teamId, userId]);
    expect(remaining).toHaveLength(0);
  });

  it('rejects non-coach', async () => {
    const coach = await createTestUser('coach', 'coach@test.com');
    const parent = await createTestUser('parent', 'parent@test.com');
    const teamId = await createTestTeam(coach);
    await callProcOne('add_team_member', [teamId, parent, 'parent', coach]);

    const created = await callProcOne<{ id: string }>(
      'save_lineup',
      [null, teamId, coach, '{}', '[]', '[]', '[]', 'draft'],
    );

    await expect(
      callProcOne('delete_lineup', [created.id, parent]),
    ).rejects.toThrow(/Unauthorized/);
  });
});
