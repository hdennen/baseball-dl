import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
  setup, teardown, resetMock, execute,
  getMockPool, teamRow, teamPlayerRow, membershipRow,
} from './helpers.js';

beforeAll(setup);
afterAll(teardown);
beforeEach(resetMock);

describe('team boundary', () => {
  describe('createTeam', () => {
    it('calls create_team with correct params and maps response', async () => {
      const mock = getMockPool();
      mock.onQuery('create_team', [teamRow({ id: 'new-team', name: 'Sox' })]);

      const result = await execute(
        `mutation CreateTeam($name: String!, $seasonId: ID, $leagueId: ID) {
          createTeam(name: $name, seasonId: $seasonId, leagueId: $leagueId) {
            id name seasonId leagueId createdBy createdAt updatedAt
          }
        }`,
        { name: 'Sox', seasonId: 'season-1', leagueId: 'league-1' },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.createTeam).toMatchObject({
        id: 'new-team',
        name: 'Sox',
        createdBy: 'user-1',
      });

      const calls = mock.getCalls('create_team');
      expect(calls).toHaveLength(1);
      expect(calls[0].params).toEqual(['Sox', 'season-1', 'league-1', 'user-1']);
    });

    it('passes null for optional seasonId and leagueId', async () => {
      const mock = getMockPool();
      mock.onQuery('create_team', [teamRow()]);

      await execute(
        'mutation { createTeam(name: "T") { id } }',
        undefined,
        'user-1',
      );

      const calls = mock.getCalls('create_team');
      expect(calls[0].params).toEqual(['T', null, null, 'user-1']);
    });
  });

  describe('myTeams', () => {
    it('calls get_user_teams and maps multiple rows', async () => {
      const mock = getMockPool();
      mock.onQuery('get_user_teams', [
        teamRow({ id: 'team-a', name: 'Team A' }),
        teamRow({ id: 'team-b', name: 'Team B' }),
      ]);

      const result = await execute(
        '{ myTeams { id name } }',
        undefined,
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      const teams = result.data?.myTeams as unknown[];
      expect(teams).toHaveLength(2);
      expect(teams).toEqual([
        expect.objectContaining({ id: 'team-a', name: 'Team A' }),
        expect.objectContaining({ id: 'team-b', name: 'Team B' }),
      ]);

      const calls = mock.getCalls('get_user_teams');
      expect(calls).toHaveLength(1);
      expect(calls[0].params).toEqual(['user-1']);
    });
  });

  describe('team', () => {
    it('calls get_team with teamId and userId', async () => {
      const mock = getMockPool();
      mock.onQuery('get_team', [teamRow({ id: 'team-x' })]);

      const result = await execute(
        '{ team(id: "team-x") { id name } }',
        undefined,
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.team).toMatchObject({ id: 'team-x' });

      const calls = mock.getCalls('get_team');
      expect(calls).toHaveLength(1);
      expect(calls[0].params).toEqual(['team-x', 'user-1']);
    });

    it('returns null when no rows', async () => {
      getMockPool(); // no handler registered = empty rows

      const result = await execute(
        '{ team(id: "missing") { id } }',
        undefined,
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.team).toBeNull();
    });
  });

  describe('teamPlayers', () => {
    it('calls get_team_players and maps out_ prefixed columns', async () => {
      const mock = getMockPool();
      mock.onQuery('get_team_players', [
        teamPlayerRow({ out_player_id: 'p1', out_name: 'Alice', out_number: 3 }),
        teamPlayerRow({ out_player_id: 'p2', out_name: 'Bob', out_number: null }),
      ]);

      const result = await execute(
        '{ teamPlayers(teamId: "team-1") { id name number rosterEntryId } }',
        undefined,
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      const players = result.data?.teamPlayers as Array<Record<string, unknown>>;
      expect(players).toHaveLength(2);
      expect(players[0]).toMatchObject({ id: 'p1', name: 'Alice', number: 3 });
      expect(players[1]).toMatchObject({ id: 'p2', name: 'Bob', number: null });

      const calls = mock.getCalls('get_team_players');
      expect(calls[0].params).toEqual(['team-1', 'user-1']);
    });
  });

  describe('Team field resolvers', () => {
    it('resolves nested players, lineups, and members on Team', async () => {
      const mock = getMockPool();
      mock.onQuery('get_user_teams', [teamRow({ id: 'team-1' })]);
      mock.onQuery('get_team_players', [teamPlayerRow()]);
      mock.onQuery('get_team_lineups', []);
      mock.onQuery('get_team_members', [membershipRow()]);

      const result = await execute(
        `{ myTeams {
          id
          players { id name }
          lineups { id }
          members { id role userEmail }
        }}`,
        undefined,
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      const team = (result.data?.myTeams as Array<Record<string, unknown>>)[0];
      expect(team.players).toEqual([
        expect.objectContaining({ id: 'player-1', name: 'Test Player' }),
      ]);
      expect(team.lineups).toEqual([]);
      expect(team.members).toEqual([
        expect.objectContaining({ role: 'head_coach', userEmail: 'coach@test.com' }),
      ]);
    });
  });
});
