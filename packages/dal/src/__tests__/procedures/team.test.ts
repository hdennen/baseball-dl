import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupDB, teardownDB, resetDB,
  callProcOne, callProc, createTestUser, createTestTeam,
} from '../helpers.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(resetDB);

describe('create_team', () => {
  it('creates a team and auto-enrolls the creator as head_coach', async () => {
    const userId = await createTestUser();
    const team = await callProcOne<{ id: string; name: string; created_by: string }>(
      'create_team',
      ['Sox', null, null, userId],
    );

    expect(team.name).toBe('Sox');
    expect(team.created_by).toBe(userId);

    const members = await callProc<{ out_user_id: string; out_role: string }>(
      'get_team_members',
      [team.id, userId],
    );
    expect(members).toHaveLength(1);
    expect(members[0].out_role).toBe('head_coach');
    expect(members[0].out_user_id).toBe(userId);
  });
});

describe('get_user_teams', () => {
  it('returns teams the user is a member of', async () => {
    const userId = await createTestUser();
    await createTestTeam(userId, 'Team A');
    await createTestTeam(userId, 'Team B');

    const teams = await callProc<{ name: string }>('get_user_teams', [userId]);
    const names = teams.map((t) => t.name);
    expect(names).toContain('Team A');
    expect(names).toContain('Team B');
  });

  it('does not return teams user is not a member of', async () => {
    const user1 = await createTestUser('u1', 'u1@test.com');
    const user2 = await createTestUser('u2', 'u2@test.com');
    await createTestTeam(user1, 'Private Team');

    const teams = await callProc('get_user_teams', [user2]);
    expect(teams).toHaveLength(0);
  });
});

describe('get_team', () => {
  it('returns the team for a member', async () => {
    const userId = await createTestUser();
    const teamId = await createTestTeam(userId);

    const team = await callProcOne<{ id: string; name: string }>('get_team', [teamId, userId]);
    expect(team.id).toBe(teamId);
  });

  it('throws for non-member', async () => {
    const user1 = await createTestUser('u1', 'u1@test.com');
    const user2 = await createTestUser('u2', 'u2@test.com');
    const teamId = await createTestTeam(user1);

    await expect(
      callProcOne('get_team', [teamId, user2]),
    ).rejects.toThrow(/Unauthorized/);
  });
});
