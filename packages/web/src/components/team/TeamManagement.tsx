import { Box, Paper, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { useMutation } from '@apollo/client/react';
import { useStytchUser } from '@stytch/react';
import { useNavigate } from 'react-router-dom';
import TeamSelector from './TeamSelector';
import PlayerManagement from '../PlayerManagement';
import { useTeamSync } from '../../hooks/useTeamSync';
import useBaseballStore from '../../store/useBaseballStore';
import { CREATE_PLAYER_ON_TEAM, REMOVE_PLAYER_FROM_TEAM, TEAM_PLAYERS } from '../../graphql/operations';

function TeamManagement() {
  const { user } = useStytchUser();
  const navigate = useNavigate();
  const { currentTeamId, players } = useBaseballStore();
  const { loading: syncLoading, error: syncError } = useTeamSync();

  const [createPlayer] = useMutation(CREATE_PLAYER_ON_TEAM, {
    refetchQueries: [{ query: TEAM_PLAYERS, variables: { teamId: currentTeamId } }],
  });

  const [removePlayer] = useMutation(REMOVE_PLAYER_FROM_TEAM, {
    refetchQueries: [{ query: TEAM_PLAYERS, variables: { teamId: currentTeamId } }],
  });

  const handleAddPlayer = async (name: string) => {
    if (!currentTeamId) return;
    await createPlayer({ variables: { teamId: currentTeamId, name } });
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!currentTeamId) return;
    await removePlayer({ variables: { playerId, teamId: currentTeamId } });
  };

  if (!user) {
    return (
      <Box>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Team Management
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to create and manage your teams.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <TeamSelector />

      {currentTeamId && (
        <>
          {syncError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load roster: {syncError.message}
            </Alert>
          )}

          {syncLoading && players.length === 0 ? (
            <Paper elevation={2} sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Paper>
          ) : (
            <PlayerManagement
              players={players}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              title="Team Roster"
              subtitle="Manage your team's roster. These players will be available in the Batting Order and Lineup tabs."
            />
          )}
        </>
      )}

      {!currentTeamId && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" align="center">
            Select or create a team above to manage its roster.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default TeamManagement;
