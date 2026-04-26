import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { setup, teardown, resetMock, execute } from './helpers.js';

beforeAll(setup);
afterAll(teardown);
beforeEach(resetMock);

describe('auth boundary', () => {
  it('health returns ok without authentication', async () => {
    const result = await execute('{ health }');
    expect(result.errors).toBeUndefined();
    expect(result.data?.health).toBe('ok');
  });

  it('me returns null without authentication', async () => {
    const result = await execute('{ me { id } }');
    expect(result.errors).toBeUndefined();
    expect(result.data?.me).toBeNull();
  });

  it('me returns user id when authenticated', async () => {
    const result = await execute('{ me { id } }', undefined, 'user-1');
    expect(result.errors).toBeUndefined();
    expect(result.data?.me).toEqual({ id: 'user-1' });
  });

  const protectedQueries = [
    { name: 'myTeams', query: '{ myTeams { id } }' },
    { name: 'team', query: '{ team(id: "t1") { id } }' },
    { name: 'teamPlayers', query: '{ teamPlayers(teamId: "t1") { id } }' },
    { name: 'teamLineups', query: '{ teamLineups(teamId: "t1") { id } }' },
    { name: 'lineup', query: '{ lineup(id: "l1") { id } }' },
  ];

  for (const { name, query } of protectedQueries) {
    it(`${name} rejects unauthenticated requests`, async () => {
      const result = await execute(query);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].extensions?.code).toBe('UNAUTHENTICATED');
    });
  }

  const protectedMutations = [
    {
      name: 'createTeam',
      query: 'mutation { createTeam(name: "T") { id } }',
    },
    {
      name: 'createPlayerOnTeam',
      query: 'mutation { createPlayerOnTeam(teamId: "t1", name: "P") { id } }',
    },
    {
      name: 'saveLineup',
      query: `mutation {
        saveLineup(input: {
          teamId: "t1"
          availablePlayerIds: []
          battingOrder: []
          innings: [{ positions: "{}", fieldConfig: { centerField: true, centerLeftField: false, centerRightField: false } }]
        }) { id }
      }`,
    },
    {
      name: 'deleteLineup',
      query: 'mutation { deleteLineup(id: "l1") }',
    },
    {
      name: 'addTeamMember',
      query: 'mutation { addTeamMember(teamId: "t1", userId: "u2", role: head_coach) { id } }',
    },
    {
      name: 'removeTeamMember',
      query: 'mutation { removeTeamMember(teamId: "t1", userId: "u2") }',
    },
  ];

  for (const { name, query } of protectedMutations) {
    it(`${name} rejects unauthenticated requests`, async () => {
      const result = await execute(query);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].extensions?.code).toBe('UNAUTHENTICATED');
    });
  }
});
