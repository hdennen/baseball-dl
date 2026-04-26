import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
  setup, teardown, resetMock, execute,
  getMockPool, membershipMutationRow,
} from './helpers.js';

beforeAll(setup);
afterAll(teardown);
beforeEach(resetMock);

describe('membership boundary', () => {
  describe('addTeamMember', () => {
    it('passes teamId, userId, role, and requesting userId to add_team_member', async () => {
      const mock = getMockPool();
      mock.onQuery('add_team_member', [membershipMutationRow()]);

      const result = await execute(
        `mutation AddMember($teamId: ID!, $userId: ID!, $role: TeamMemberRole!) {
          addTeamMember(teamId: $teamId, userId: $userId, role: $role) {
            id teamId userId role
          }
        }`,
        { teamId: 'team-1', userId: 'user-2', role: 'assistant_coach' },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.addTeamMember).toMatchObject({
        teamId: 'team-1',
        userId: 'user-2',
        role: 'assistant_coach',
      });

      const calls = mock.getCalls('add_team_member');
      expect(calls).toHaveLength(1);
      expect(calls[0].params).toEqual(['team-1', 'user-2', 'assistant_coach', 'user-1']);
    });
  });

  describe('removeTeamMember', () => {
    it('passes teamId, userId, and requesting userId to remove_team_member', async () => {
      const mock = getMockPool();
      mock.onQuery('remove_team_member', [{ remove_team_member: true }]);

      const result = await execute(
        `mutation RemoveMember($teamId: ID!, $userId: ID!) {
          removeTeamMember(teamId: $teamId, userId: $userId)
        }`,
        { teamId: 'team-1', userId: 'user-2' },
        'user-1',
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.removeTeamMember).toBe(true);

      const calls = mock.getCalls('remove_team_member');
      expect(calls).toHaveLength(1);
      expect(calls[0].params).toEqual(['team-1', 'user-2', 'user-1']);
    });
  });
});
