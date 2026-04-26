import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { TEAM_PLAYERS, TEAM_PLAYERS_FULL } from '../graphql/operations';
import useBaseballStore from '../store/useBaseballStore';
import type { TeamPlayer } from '@baseball-dl/shared';

/**
 * Syncs a team's roster from the API into the Zustand store.
 * Fetches both the active roster (for display) and the full roster
 * including removed players (for lineup rendering).
 */
export function useTeamSync() {
  const { currentTeamId, loadTeamPlayers, loadAllTeamPlayers } = useBaseballStore();

  const { data, loading, error, refetch } = useQuery<{ teamPlayers: TeamPlayer[] }>(
    TEAM_PLAYERS,
    {
      variables: { teamId: currentTeamId },
      skip: !currentTeamId,
      fetchPolicy: 'cache-and-network',
    }
  );

  const { data: fullData } = useQuery<{ teamPlayersFull: TeamPlayer[] }>(
    TEAM_PLAYERS_FULL,
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

  useEffect(() => {
    if (fullData?.teamPlayersFull) {
      loadAllTeamPlayers(fullData.teamPlayersFull);
    }
  }, [fullData?.teamPlayersFull, loadAllTeamPlayers]);

  return { loading, error, refetch };
}
