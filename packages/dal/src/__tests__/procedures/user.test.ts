import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupDB, teardownDB, resetDB, callProcOne, callProc } from '../helpers.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(resetDB);

describe('get_or_create_user', () => {
  it('creates a new user and returns their id', async () => {
    const row = await callProcOne<{ out_id: string; out_email: string; out_name: string }>(
      'get_or_create_user',
      ['stytch-abc', 'coach@test.com', 'Coach Smith'],
    );

    expect(row.out_id).toBeDefined();
    expect(row.out_email).toBe('coach@test.com');
    expect(row.out_name).toBe('Coach Smith');
  });

  it('is idempotent on stytch_user_id and updates email', async () => {
    const first = await callProcOne<{ out_id: string; out_email: string }>(
      'get_or_create_user',
      ['stytch-abc', 'old@test.com', null],
    );
    const second = await callProcOne<{ out_id: string; out_email: string }>(
      'get_or_create_user',
      ['stytch-abc', 'new@test.com', null],
    );

    expect(second.out_id).toBe(first.out_id);
    expect(second.out_email).toBe('new@test.com');
  });

  it('preserves existing name when new name is null', async () => {
    await callProcOne('get_or_create_user', ['stytch-abc', 'a@b.com', 'Original']);
    const row = await callProcOne<{ out_name: string }>(
      'get_or_create_user',
      ['stytch-abc', 'a@b.com', null],
    );

    expect(row.out_name).toBe('Original');
  });
});
