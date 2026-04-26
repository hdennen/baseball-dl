import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
  setup, teardown, resetMock, execute,
  getMockPool, lineupRow,
} from './helpers.js';

beforeAll(setup);
afterAll(teardown);
beforeEach(resetMock);

describe('lineup boundary', () => {
  describe('saveLineup', () => {
    const SAVE_LINEUP = `
      mutation SaveLineup($input: SaveLineupInput!) {
        saveLineup(input: $input) {
          id teamId status createdBy
          gameContext { dateTime opponent location side notes }
          availablePlayerIds
          battingOrder
          innings { positions fieldConfig { centerField centerLeftField centerRightField } }
        }
      }
    `;

    it('transforms fieldConfig keys from camelCase to kebab-case', async () => {
      const mock = getMockPool();
      mock.onQuery('save_lineup', [lineupRow()]);

      await execute(
        SAVE_LINEUP,
        {
          input: {
            teamId: 'team-1',
            availablePlayerIds: ['p1'],
            battingOrder: ['p1'],
            innings: [
              {
                positions: { pitcher: 'p1' },
                fieldConfig: { centerField: true, centerLeftField: false, centerRightField: false },
              },
            ],
          },
        },
        'user-1',
      );

      const calls = mock.getCalls('save_lineup');
      expect(calls).toHaveLength(1);

      const params = calls[0].params;
      const inningsParam = JSON.parse(params[6] as string);
      expect(inningsParam[0]).toEqual({
        positions: { pitcher: 'p1' },
        fieldConfig: {
          'center-field': true,
          'center-left-field': false,
          'center-right-field': false,
        },
      });
    });

    it('stringifies JSONB params (gameContext, availablePlayerIds, battingOrder, innings)', async () => {
      const mock = getMockPool();
      mock.onQuery('save_lineup', [lineupRow()]);

      await execute(
        SAVE_LINEUP,
        {
          input: {
            teamId: 'team-1',
            gameContext: { opponent: 'Mets', location: 'Field 1' },
            availablePlayerIds: ['p1', 'p2'],
            battingOrder: ['p2', 'p1'],
            innings: [
              {
                positions: { catcher: 'p1' },
                fieldConfig: { centerField: true, centerLeftField: false, centerRightField: false },
              },
            ],
          },
        },
        'user-1',
      );

      const params = getMockPool().getCalls('save_lineup')[0].params;
      expect(JSON.parse(params[3] as string)).toEqual({ opponent: 'Mets', location: 'Field 1' });
      expect(JSON.parse(params[4] as string)).toEqual(['p1', 'p2']);
      expect(JSON.parse(params[5] as string)).toEqual(['p2', 'p1']);
      expect(typeof params[6]).toBe('string');
    });

    it('defaults status to draft when omitted', async () => {
      const mock = getMockPool();
      mock.onQuery('save_lineup', [lineupRow()]);

      await execute(
        SAVE_LINEUP,
        {
          input: {
            teamId: 'team-1',
            availablePlayerIds: [],
            battingOrder: [],
            innings: [
              {
                positions: {},
                fieldConfig: { centerField: true, centerLeftField: false, centerRightField: false },
              },
            ],
          },
        },
        'user-1',
      );

      const params = getMockPool().getCalls('save_lineup')[0].params;
      expect(params[7]).toBe('draft');
    });

    it('passes explicit status value', async () => {
      const mock = getMockPool();
      mock.onQuery('save_lineup', [lineupRow({ status: 'published' })]);

      await execute(
        SAVE_LINEUP,
        {
          input: {
            teamId: 'team-1',
            availablePlayerIds: [],
            battingOrder: [],
            innings: [
              {
                positions: {},
                fieldConfig: { centerField: true, centerLeftField: false, centerRightField: false },
              },
            ],
            status: 'published',
          },
        },
        'user-1',
      );

      const params = getMockPool().getCalls('save_lineup')[0].params;
      expect(params[7]).toBe('published');
    });

    it('passes null for id when creating a new lineup', async () => {
      const mock = getMockPool();
      mock.onQuery('save_lineup', [lineupRow()]);

      await execute(
        SAVE_LINEUP,
        {
          input: {
            teamId: 'team-1',
            availablePlayerIds: [],
            battingOrder: [],
            innings: [
              {
                positions: {},
                fieldConfig: { centerField: true, centerLeftField: false, centerRightField: false },
              },
            ],
          },
        },
        'user-1',
      );

      const params = getMockPool().getCalls('save_lineup')[0].params;
      expect(params[0]).toBeNull();
    });

    it('passes existing id when updating a lineup', async () => {
      const mock = getMockPool();
      mock.onQuery('save_lineup', [lineupRow()]);

      await execute(
        SAVE_LINEUP,
        {
          input: {
            id: 'existing-lineup',
            teamId: 'team-1',
            availablePlayerIds: [],
            battingOrder: [],
            innings: [
              {
                positions: {},
                fieldConfig: { centerField: true, centerLeftField: false, centerRightField: false },
              },
            ],
          },
        },
        'user-1',
      );

      const params = getMockPool().getCalls('save_lineup')[0].params;
      expect(params[0]).toBe('existing-lineup');
    });

    it('maps response with correct field config back to camelCase', async () => {
      const mock = getMockPool();
      mock.onQuery('save_lineup', [lineupRow()]);

      const result = await execute(
        SAVE_LINEUP,
        {
          input: {
            teamId: 'team-1',
            availablePlayerIds: ['player-1'],
            battingOrder: ['player-1'],
            innings: [
              {
                positions: { pitcher: 'player-1' },
                fieldConfig: { centerField: true, centerLeftField: false, centerRightField: false },
              },
            ],
          },
        },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      const lineup = result.data?.saveLineup as Record<string, unknown>;
      expect(lineup.status).toBe('draft');
      expect(lineup.teamId).toBe('team-1');

      const innings = lineup.innings as Array<Record<string, unknown>>;
      const fc = innings[0].fieldConfig as Record<string, boolean>;
      expect(fc.centerField).toBe(true);
      expect(fc.centerLeftField).toBe(false);
      expect(fc.centerRightField).toBe(false);
    });
  });

  describe('lineup query', () => {
    it('calls get_lineup with lineupId and userId', async () => {
      const mock = getMockPool();
      mock.onQuery('get_lineup', [lineupRow({ id: 'lineup-x' })]);

      const result = await execute(
        `query GetLineup($id: ID!) {
          lineup(id: $id) { id teamId status }
        }`,
        { id: 'lineup-x' },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.lineup).toMatchObject({ id: 'lineup-x', teamId: 'team-1' });

      const calls = mock.getCalls('get_lineup');
      expect(calls[0].params).toEqual(['lineup-x', 'user-1']);
    });

    it('returns null when lineup not found', async () => {
      getMockPool();

      const result = await execute(
        '{ lineup(id: "missing") { id } }',
        undefined,
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.lineup).toBeNull();
    });
  });

  describe('teamLineups', () => {
    it('calls get_team_lineups with teamId and userId', async () => {
      const mock = getMockPool();
      mock.onQuery('get_team_lineups', [
        lineupRow({ id: 'l1' }),
        lineupRow({ id: 'l2', status: 'published' }),
      ]);

      const result = await execute(
        '{ teamLineups(teamId: "team-1") { id status } }',
        undefined,
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      const lineups = result.data?.teamLineups as Array<Record<string, unknown>>;
      expect(lineups).toHaveLength(2);
      expect(lineups[0].status).toBe('draft');
      expect(lineups[1].status).toBe('published');

      const calls = mock.getCalls('get_team_lineups');
      expect(calls[0].params).toEqual(['team-1', 'user-1']);
    });
  });

  describe('deleteLineup', () => {
    it('calls delete_lineup and returns boolean', async () => {
      const mock = getMockPool();
      mock.onQuery('delete_lineup', [{ delete_lineup: true }]);

      const result = await execute(
        'mutation { deleteLineup(id: "lineup-1") }',
        undefined,
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.deleteLineup).toBe(true);

      const calls = mock.getCalls('delete_lineup');
      expect(calls[0].params).toEqual(['lineup-1', 'user-1']);
    });
  });
});
