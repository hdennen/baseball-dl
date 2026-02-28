import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { TEAM_PLAYERS } from '../graphql/operations';
import useBaseballStore from '../store/useBaseballStore';
import type { TeamPlayer } from '@baseball-dl/shared';

/**
 * Syncs a team's roster from the API into the Zustand store.
 * When currentTeamId is set, fetches the roster and calls loadTeamPlayers.
 * Returns the query result for use by the consuming component.
 */
export function useTeamSync() {
  const { currentTeamId, loadTeamPlayers } = useBaseballStore();

  const { data, loading, error, refetch } = useQuery<{ teamPlayers: TeamPlayer[] }>(
    TEAM_PLAYERS,
    {
      variables: { teamId: currentTeamId },
      skip: !currentTeamId,
      fetchPolicy: 'cache-and-network',
    }
  );

  useEffect(() => {
    if (data?.teamPlayers) {
      const players = data.teamPlayers.map((tp) => ({
        id: tp.id,
        name: tp.name,
        createdBy: tp.createdBy,
        createdAt: tp.createdAt,
        updatedAt: tp.updatedAt,
      }));
      loadTeamPlayers(players);
    }
  }, [data?.teamPlayers, loadTeamPlayers]);

  return { loading, error, refetch };
}
