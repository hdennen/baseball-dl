import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupDB, teardownDB, resetDB,
  callProcOne, callProc, createTestUser, createTestTeam,
} from '../helpers.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(resetDB);

describe('add_team_member', () => {
  it('adds a member with the specified role', async () => {
    const coach = await createTestUser('coach', 'coach@test.com');
    const newUser = await createTestUser('new', 'new@test.com');
    const teamId = await createTestTeam(coach);

    const membership = await callProcOne<{ team_id: string; user_id: string; role: string }>(
      'add_team_member',
      [teamId, newUser, 'assistant_coach', coach],
    );

    expect(membership.team_id).toBe(teamId);
    expect(membership.user_id).toBe(newUser);
    expect(membership.role).toBe('assistant_coach');
  });

  it('rejects when requester is not a coach', async () => {
    const coach = await createTestUser('coach', 'coach@test.com');
    const parent = await createTestUser('parent', 'parent@test.com');
    const other = await createTestUser('other', 'other@test.com');
    const teamId = await createTestTeam(coach);

    await callProcOne('add_team_member', [teamId, parent, 'parent', coach]);

    await expect(
      callProcOne('add_team_member', [teamId, other, 'parent', parent]),
    ).rejects.toThrow(/Unauthorized/);
  });
});

describe('remove_team_member', () => {
  it('removes a member', async () => {
    const coach = await createTestUser('coach', 'coach@test.com');
    const assistant = await createTestUser('asst', 'asst@test.com');
    const teamId = await createTestTeam(coach);

    await callProcOne('add_team_member', [teamId, assistant, 'assistant_coach', coach]);

    const result = await callProcOne<{ remove_team_member: boolean }>(
      'remove_team_member',
      [teamId, assistant, coach],
    );
    expect(result.remove_team_member).toBe(true);

    const members = await callProc('get_team_members', [teamId, coach]);
    expect(members).toHaveLength(1);
  });

  it('prevents removing the last head_coach', async () => {
    const coach = await createTestUser('coach', 'coach@test.com');
    const teamId = await createTestTeam(coach);

    await expect(
      callProcOne('remove_team_member', [teamId, coach, coach]),
    ).rejects.toThrow(/last head coach/i);
  });

  it('allows removing a head_coach when another exists', async () => {
    const coach1 = await createTestUser('c1', 'c1@test.com');
    const coach2 = await createTestUser('c2', 'c2@test.com');
    const teamId = await createTestTeam(coach1);

    await callProcOne('add_team_member', [teamId, coach2, 'head_coach', coach1]);

    const result = await callProcOne<{ remove_team_member: boolean }>(
      'remove_team_member',
      [teamId, coach1, coach2],
    );
    expect(result.remove_team_member).toBe(true);
  });

  it('throws when member not found', async () => {
    const coach = await createTestUser('coach', 'coach@test.com');
    const random = await createTestUser('rand', 'rand@test.com');
    const teamId = await createTestTeam(coach);

    await expect(
      callProcOne('remove_team_member', [teamId, random, coach]),
    ).rejects.toThrow(/not found/i);
  });
});
