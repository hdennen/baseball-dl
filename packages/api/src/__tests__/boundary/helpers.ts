import { ApolloServer } from '@apollo/server';
import { createDAL } from '@baseball-dl/dal';
import type { DAL } from '@baseball-dl/dal';
import type { Pool } from 'pg';
import { typeDefs } from '../../schema.js';
import { resolvers } from '../../resolvers.js';
import type { ApiContext } from '../../context.js';

// ---------------------------------------------------------------------------
// Mock Pool
// ---------------------------------------------------------------------------

interface QueryCall {
  sql: string;
  params: unknown[];
}

export function createMockPool() {
  const calls: QueryCall[] = [];
  const handlers: Array<{ match: string; rows: unknown[] }> = [];

  const pool = {
    query: async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params: params ?? [] });
      for (const handler of handlers) {
        if (sql.includes(handler.match)) {
          return { rows: handler.rows.map((r) => ({ ...r })) };
        }
      }
      return { rows: [] };
    },
  } as unknown as Pool;

  return {
    pool,
    calls,
    onQuery(sqlSubstring: string, rows: unknown[]) {
      handlers.push({ match: sqlSubstring, rows });
      return this;
    },
    getCalls(sqlSubstring: string) {
      return calls.filter((c) => c.sql.includes(sqlSubstring));
    },
    reset() {
      calls.length = 0;
      handlers.length = 0;
    },
  };
}

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

let server: ApolloServer<ApiContext>;
let mockPool: ReturnType<typeof createMockPool>;
let dal: DAL;

export function getMockPool() {
  return mockPool;
}

export async function setup() {
  mockPool = createMockPool();
  dal = createDAL(mockPool.pool);
  server = new ApolloServer<ApiContext>({ typeDefs, resolvers });
  await server.start();
}

export async function teardown() {
  await server.stop();
}

export function resetMock() {
  mockPool.reset();
}

export async function execute(
  query: string,
  variables?: Record<string, unknown>,
  userId?: string,
) {
  const response = await server.executeOperation(
    { query, variables },
    { contextValue: { dal, userId: userId ?? null } },
  );
  if (response.body.kind !== 'single') {
    throw new Error('Expected single result');
  }
  return response.body.singleResult;
}

// ---------------------------------------------------------------------------
// Row factories — shapes match what Postgres stored procedures return
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

export function teamRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'team-1',
    name: 'Test Team',
    season_id: null,
    league_id: null,
    created_by: 'user-1',
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function teamPlayerRow(overrides: Record<string, unknown> = {}) {
  return {
    out_player_id: 'player-1',
    out_name: 'Test Player',
    out_number: 7,
    out_roster_entry_id: 'roster-1',
    out_created_by: 'user-1',
    out_created_at: NOW,
    out_updated_at: NOW,
    ...overrides,
  };
}

export function rosterEntryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'roster-1',
    player_id: 'player-1',
    team_id: 'team-1',
    number: 7,
    created_by: 'user-1',
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function playerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'player-1',
    name: 'Test Player',
    created_by: 'user-1',
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function membershipRow(overrides: Record<string, unknown> = {}) {
  return {
    out_id: 'mem-1',
    out_team_id: 'team-1',
    out_user_id: 'user-1',
    out_role: 'head_coach',
    out_user_email: 'coach@test.com',
    out_user_name: 'Coach',
    out_created_by: 'user-1',
    out_created_at: NOW,
    out_updated_at: NOW,
    ...overrides,
  };
}

export function membershipMutationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mem-1',
    team_id: 'team-1',
    user_id: 'user-2',
    role: 'assistant_coach',
    created_by: 'user-1',
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function lineupRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lineup-1',
    team_id: 'team-1',
    game_context: { dateTime: '2026-03-15T18:00:00.000Z', opponent: 'Blue Jays' },
    available_player_ids: ['player-1'],
    batting_order: ['player-1'],
    innings: [
      {
        positions: { pitcher: 'player-1' },
        field_config: { 'center-field': true, 'center-left-field': false, 'center-right-field': false },
      },
    ],
    status: 'draft',
    created_by: 'user-1',
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}
