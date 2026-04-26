import pg from 'pg';

const DATABASE_URL = 'postgresql://baseball:baseball@localhost:5432/baseball_dl';

let pool: pg.Pool;

export async function setupDB() {
  pool = new pg.Pool({ connectionString: DATABASE_URL });
}

export async function teardownDB() {
  await pool.end();
}

export async function resetDB() {
  await pool.query('TRUNCATE users CASCADE');
}

export function getPool() {
  return pool;
}

/**
 * Execute a stored procedure and return all rows.
 */
export async function callProc<T extends Record<string, unknown> = Record<string, unknown>>(
  procName: string,
  params: unknown[] = [],
): Promise<T[]> {
  const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `SELECT * FROM ${procName}(${placeholders})`;
  const { rows } = await pool.query(sql, params);
  return rows as T[];
}

/**
 * Execute a stored procedure and return the first row.
 */
export async function callProcOne<T extends Record<string, unknown> = Record<string, unknown>>(
  procName: string,
  params: unknown[] = [],
): Promise<T> {
  const rows = await callProc<T>(procName, params);
  if (rows.length === 0) {
    throw new Error(`${procName} returned no rows`);
  }
  return rows[0];
}

/**
 * Create a test user and return the internal UUID.
 */
export async function createTestUser(
  stytchId = 'stytch-test-1',
  email = 'test@example.com',
  name = 'Test User',
): Promise<string> {
  const row = await callProcOne<{ out_id: string }>(
    'get_or_create_user',
    [stytchId, email, name],
  );
  return row.out_id;
}

/**
 * Create a test team and return its id.
 */
export async function createTestTeam(
  userId: string,
  name = 'Test Team',
): Promise<string> {
  const row = await callProcOne<{ id: string }>('create_team', [name, null, null, userId]);
  return row.id;
}
