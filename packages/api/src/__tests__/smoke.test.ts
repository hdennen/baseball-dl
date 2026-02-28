import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setup, teardown, resetDB, execute, getDAL } from './setup.js';

let userId: string;
let teamId: string;
let playerId: string;
let rosterEntryId: string;
let lineupId: string;

beforeAll(async () => {
  await setup();
  await resetDB();
});

afterAll(async () => {
  await teardown();
});

describe('API smoke tests', () => {
  it('health query returns ok', async () => {
    const result = await execute('{ health }');
    expect(result.errors).toBeUndefined();
    expect(result.data?.health).toBe('ok');
  });

  it('create user via DAL', async () => {
    const dal = getDAL();
    const user = await dal.getOrCreateUser('stytch-smoke-test', 'coach@smoke.test', 'Coach Smith');
    expect(user.id).toBeDefined();
    expect(user.email).toBe('coach@smoke.test');
    expect(user.name).toBe('Coach Smith');
    userId = user.id;
  });

  it('unauthenticated query returns UNAUTHENTICATED error', async () => {
    const result = await execute('{ myTeams { id } }');
    expect(result.errors).toBeDefined();
    expect(result.errors![0].extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('createTeam returns team with head_coach membership', async () => {
    const result = await execute(
      `mutation CreateTeam($name: String!) {
        createTeam(name: $name) {
          id name createdBy createdAt updatedAt
          members { id role userEmail userName }
        }
      }`,
      { name: 'Smoke Sox' },
      userId,
    );
    expect(result.errors).toBeUndefined();
    const team = result.data!.createTeam as Record<string, unknown>;
    expect(team.name).toBe('Smoke Sox');
    expect(team.createdBy).toBe(userId);
    expect(team.createdAt).toMatch(/Z$/);

    const members = team.members as Array<Record<string, unknown>>;
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('head_coach');
    expect(members[0].userEmail).toBe('coach@smoke.test');

    teamId = team.id as string;
  });

  it('createPlayerOnTeam returns player with roster entry', async () => {
    const result = await execute(
      `mutation CreatePlayer($teamId: ID!, $name: String!, $number: Int) {
        createPlayerOnTeam(teamId: $teamId, name: $name, number: $number) {
          id name number rosterEntryId createdBy createdAt
        }
      }`,
      { teamId, name: 'Tommy Jones', number: 7 },
      userId,
    );
    expect(result.errors).toBeUndefined();
    const player = result.data!.createPlayerOnTeam as Record<string, unknown>;
    expect(player.name).toBe('Tommy Jones');
    expect(player.number).toBe(7);
    expect(player.rosterEntryId).toBeDefined();
    expect(player.createdBy).toBe(userId);

    playerId = player.id as string;
    rosterEntryId = player.rosterEntryId as string;
  });

  it('updateRosterEntry changes jersey number', async () => {
    const result = await execute(
      `mutation UpdateRoster($id: ID!, $number: Int) {
        updateRosterEntry(id: $id, number: $number) {
          id number playerId
        }
      }`,
      { id: rosterEntryId, number: 12 },
      userId,
    );
    expect(result.errors).toBeUndefined();
    const entry = result.data!.updateRosterEntry as Record<string, unknown>;
    expect(entry.number).toBe(12);
    expect(entry.playerId).toBe(playerId);
  });

  it('saveLineup creates a lineup with full game context', async () => {
    const result = await execute(
      `mutation SaveLineup($input: SaveLineupInput!) {
        saveLineup(input: $input) {
          id teamId status createdBy createdAt
          gameContext { dateTime opponent location side notes }
          availablePlayerIds
          battingOrder
          innings { positions fieldConfig { centerField centerLeftField centerRightField } }
        }
      }`,
      {
        input: {
          teamId,
          gameContext: {
            dateTime: '2026-03-15T18:00:00.000Z',
            opponent: 'Blue Jays',
            location: 'Field 3',
            side: 'home',
            notes: 'Bring snacks',
          },
          availablePlayerIds: [playerId],
          battingOrder: [playerId],
          innings: [
            {
              positions: { pitcher: playerId },
              fieldConfig: { centerField: true, centerLeftField: false, centerRightField: false },
            },
          ],
          status: 'draft',
        },
      },
      userId,
    );
    expect(result.errors).toBeUndefined();
    const lineup = result.data!.saveLineup as Record<string, unknown>;
    expect(lineup.teamId).toBe(teamId);
    expect(lineup.status).toBe('draft');
    expect(lineup.createdBy).toBe(userId);

    const gc = lineup.gameContext as Record<string, unknown>;
    expect(gc.dateTime).toBe('2026-03-15T18:00:00.000Z');
    expect(gc.opponent).toBe('Blue Jays');
    expect(gc.location).toBe('Field 3');
    expect(gc.side).toBe('home');
    expect(gc.notes).toBe('Bring snacks');

    expect(lineup.availablePlayerIds).toEqual([playerId]);
    expect(lineup.battingOrder).toEqual([playerId]);

    const innings = lineup.innings as Array<Record<string, unknown>>;
    expect(innings).toHaveLength(1);
    expect((innings[0].positions as Record<string, string>).pitcher).toBe(playerId);

    const fc = innings[0].fieldConfig as Record<string, boolean>;
    expect(fc.centerField).toBe(true);
    expect(fc.centerLeftField).toBe(false);
    expect(fc.centerRightField).toBe(false);

    lineupId = lineup.id as string;
  });

  it('myTeams returns full nested graph', async () => {
    const result = await execute(
      `{
        myTeams {
          id name
          players { id name number rosterEntryId }
          lineups { id status gameContext { dateTime opponent } }
          members { role userEmail }
        }
      }`,
      undefined,
      userId,
    );
    expect(result.errors).toBeUndefined();
    const teams = result.data!.myTeams as Array<Record<string, unknown>>;
    expect(teams).toHaveLength(1);
    expect(teams[0].name).toBe('Smoke Sox');

    const players = teams[0].players as Array<Record<string, unknown>>;
    expect(players).toHaveLength(1);
    expect(players[0].name).toBe('Tommy Jones');
    expect(players[0].number).toBe(12);

    const lineups = teams[0].lineups as Array<Record<string, unknown>>;
    expect(lineups).toHaveLength(1);
    expect(lineups[0].status).toBe('draft');

    const members = teams[0].members as Array<Record<string, unknown>>;
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('head_coach');
  });

  it('lineup query returns single lineup', async () => {
    const result = await execute(
      `query GetLineup($id: ID!) {
        lineup(id: $id) {
          id teamId status
          gameContext { dateTime opponent location side notes }
        }
      }`,
      { id: lineupId },
      userId,
    );
    expect(result.errors).toBeUndefined();
    const lineup = result.data!.lineup as Record<string, unknown>;
    expect(lineup.id).toBe(lineupId);
    expect(lineup.teamId).toBe(teamId);

    const gc = lineup.gameContext as Record<string, unknown>;
    expect(gc.dateTime).toBe('2026-03-15T18:00:00.000Z');
    expect(gc.notes).toBe('Bring snacks');
  });

  it('deleteLineup removes the lineup', async () => {
    const deleteResult = await execute(
      `mutation DeleteLineup($id: ID!) { deleteLineup(id: $id) }`,
      { id: lineupId },
      userId,
    );
    expect(deleteResult.errors).toBeUndefined();
    expect(deleteResult.data!.deleteLineup).toBe(true);

    const queryResult = await execute(
      `query GetLineup($id: ID!) { lineup(id: $id) { id } }`,
      { id: lineupId },
      userId,
    );
    expect(queryResult.data!.lineup).toBeNull();
  });

  it('removePlayerFromTeam removes from roster', async () => {
    const removeResult = await execute(
      `mutation Remove($playerId: ID!, $teamId: ID!) {
        removePlayerFromTeam(playerId: $playerId, teamId: $teamId)
      }`,
      { playerId, teamId },
      userId,
    );
    expect(removeResult.errors).toBeUndefined();
    expect(removeResult.data!.removePlayerFromTeam).toBe(true);

    const playersResult = await execute(
      `query Players($teamId: ID!) { teamPlayers(teamId: $teamId) { id } }`,
      { teamId },
      userId,
    );
    expect(playersResult.errors).toBeUndefined();
    expect(playersResult.data!.teamPlayers).toEqual([]);
  });
});
