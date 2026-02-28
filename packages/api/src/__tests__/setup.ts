import { ApolloServer } from '@apollo/server';
import { createPool, createDAL } from '@baseball-dl/dal';
import type { DAL } from '@baseball-dl/dal';
import type { Pool } from 'pg';
import { typeDefs } from '../schema.js';
import { resolvers } from '../resolvers.js';
import type { ApiContext } from '../context.js';

const DATABASE_URL = 'postgresql://baseball:baseball@localhost:5432/baseball_dl';

let pool: Pool;
let dal: DAL;
let server: ApolloServer<ApiContext>;

export function getDAL(): DAL {
  return dal;
}

export async function setup() {
  pool = createPool(DATABASE_URL);
  dal = createDAL(pool);
  server = new ApolloServer<ApiContext>({ typeDefs, resolvers });
  await server.start();
}

export async function teardown() {
  await server.stop();
  await pool.end();
}

export async function resetDB() {
  await pool.query('TRUNCATE users CASCADE');
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
