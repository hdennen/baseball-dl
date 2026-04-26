import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
  setup, teardown, resetMock, execute,
  getMockPool, teamPlayerRow, rosterEntryRow, playerRow,
} from './helpers.js';

beforeAll(setup);
afterAll(teardown);
beforeEach(resetMock);

describe('player boundary', () => {
  describe('createPlayerOnTeam', () => {
    it('passes teamId, name, number, userId to create_player_on_team', async () => {
      const mock = getMockPool();
      mock.onQuery('create_player_on_team', [
        teamPlayerRow({ out_player_id: 'new-p', out_name: 'Sam', out_number: 12 }),
      ]);

      const result = await execute(
        `mutation CreatePlayer($teamId: ID!, $name: String!, $number: Int) {
          createPlayerOnTeam(teamId: $teamId, name: $name, number: $number) {
            id name number rosterEntryId createdBy
          }
        }`,
        { teamId: 'team-1', name: 'Sam', number: 12 },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.createPlayerOnTeam).toMatchObject({
        id: 'new-p',
        name: 'Sam',
        number: 12,
        createdBy: 'user-1',
      });

      const calls = mock.getCalls('create_player_on_team');
      expect(calls).toHaveLength(1);
      expect(calls[0].params).toEqual(['team-1', 'Sam', 12, 'user-1']);
    });

    it('passes null when number is omitted', async () => {
      const mock = getMockPool();
      mock.onQuery('create_player_on_team', [teamPlayerRow()]);

      await execute(
        'mutation { createPlayerOnTeam(teamId: "t1", name: "X") { id } }',
        undefined,
        'user-1',
      );

      const calls = mock.getCalls('create_player_on_team');
      expect(calls[0].params).toEqual(['t1', 'X', null, 'user-1']);
    });
  });

  describe('addPlayerToTeam', () => {
    it('passes playerId, teamId, number, userId to add_player_to_team', async () => {
      const mock = getMockPool();
      mock.onQuery('add_player_to_team', [rosterEntryRow()]);

      const result = await execute(
        `mutation AddPlayer($playerId: ID!, $teamId: ID!, $number: Int) {
          addPlayerToTeam(playerId: $playerId, teamId: $teamId, number: $number) {
            id playerId teamId number
          }
        }`,
        { playerId: 'player-1', teamId: 'team-1', number: 5 },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      const calls = mock.getCalls('add_player_to_team');
      expect(calls[0].params).toEqual(['player-1', 'team-1', 5, 'user-1']);
    });
  });

  describe('updatePlayer', () => {
    it('passes id and name to update_player', async () => {
      const mock = getMockPool();
      mock.onQuery('update_player', [playerRow({ id: 'p1', name: 'Updated' })]);

      const result = await execute(
        `mutation UpdatePlayer($id: ID!, $name: String!) {
          updatePlayer(id: $id, name: $name) { id name }
        }`,
        { id: 'p1', name: 'Updated' },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.updatePlayer).toMatchObject({ id: 'p1', name: 'Updated' });

      const calls = mock.getCalls('update_player');
      expect(calls[0].params).toEqual(['p1', 'Updated', 'user-1']);
    });
  });

  describe('updateRosterEntry', () => {
    it('passes rosterEntryId and new number to update_roster_entry', async () => {
      const mock = getMockPool();
      mock.onQuery('update_roster_entry', [rosterEntryRow({ number: 99 })]);

      const result = await execute(
        `mutation UpdateRoster($id: ID!, $number: Int) {
          updateRosterEntry(id: $id, number: $number) { id number playerId }
        }`,
        { id: 'roster-1', number: 99 },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.updateRosterEntry).toMatchObject({ number: 99 });

      const calls = mock.getCalls('update_roster_entry');
      expect(calls[0].params).toEqual(['roster-1', 99, 'user-1']);
    });

    it('passes null when number is omitted', async () => {
      const mock = getMockPool();
      mock.onQuery('update_roster_entry', [rosterEntryRow({ number: null })]);

      await execute(
        'mutation { updateRosterEntry(id: "r1") { id } }',
        undefined,
        'user-1',
      );

      const calls = mock.getCalls('update_roster_entry');
      expect(calls[0].params).toEqual(['r1', null, 'user-1']);
    });
  });

  describe('removePlayerFromTeam', () => {
    it('passes playerId and teamId, returns boolean', async () => {
      const mock = getMockPool();
      mock.onQuery('remove_player_from_team', [{ remove_player_from_team: true }]);

      const result = await execute(
        `mutation Remove($playerId: ID!, $teamId: ID!) {
          removePlayerFromTeam(playerId: $playerId, teamId: $teamId)
        }`,
        { playerId: 'p1', teamId: 't1' },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.removePlayerFromTeam).toBe(true);

      const calls = mock.getCalls('remove_player_from_team');
      expect(calls[0].params).toEqual(['p1', 't1', 'user-1']);
    });
  });

  describe('teamPlayersFull', () => {
    it('calls get_team_players_full and returns removedAt field', async () => {
      const mock = getMockPool();
      const removedDate = new Date('2026-04-01T00:00:00.000Z');
      mock.onQuery('get_team_players_full', [
        teamPlayerRow({ out_player_id: 'p1', out_name: 'Alice', out_removed_at: null }),
        teamPlayerRow({ out_player_id: 'p2', out_name: 'Bob', out_removed_at: removedDate }),
      ]);

      const result = await execute(
        `query FullRoster($teamId: ID!) {
          teamPlayersFull(teamId: $teamId) {
            id name number rosterEntryId removedAt
          }
        }`,
        { teamId: 'team-1' },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.teamPlayersFull).toHaveLength(2);

      const alice = result.data?.teamPlayersFull.find((p: { id: string }) => p.id === 'p1');
      const bob = result.data?.teamPlayersFull.find((p: { id: string }) => p.id === 'p2');
      expect(alice.removedAt).toBeNull();
      expect(bob.removedAt).toBeDefined();
      expect(bob.removedAt).not.toBeNull();

      const calls = mock.getCalls('get_team_players_full');
      expect(calls).toHaveLength(1);
      expect(calls[0].params).toEqual(['team-1', 'user-1']);
    });
  });
});
