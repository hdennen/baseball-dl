import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useMutation } from '@apollo/client/react';
import { useStytchUser } from '@stytch/react';
import { useNavigate } from 'react-router-dom';
import TeamSelector from './TeamSelector';
import PlayerManagement from '../PlayerManagement';
import { useTeamSync } from '../../hooks/useTeamSync';
import useBaseballStore from '../../store/useBaseballStore';
import {
  CREATE_PLAYER_ON_TEAM,
  REMOVE_PLAYER_FROM_TEAM,
  TEAM_PLAYERS,
  TEAM_PLAYERS_FULL,
} from '../../graphql/operations';
import type { Team, TeamPlayer } from '@baseball-dl/shared';

function TeamManagement() {
  const { user } = useStytchUser();
  const navigate = useNavigate();
  const {
    currentTeamId,
    players,
    battingOrder,
    innings,
    setCurrentTeam,
    migrateToTeam,
  } = useBaseballStore();
  const { loading: syncLoading, error: syncError } = useTeamSync();

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [pendingTeam, setPendingTeam] = useState<Team | null>(null);
  const [importing, setImporting] = useState(false);
  const [removeConfirmPlayer, setRemoveConfirmPlayer] = useState<string | null>(null);

  const [createPlayer] = useMutation<{ createPlayerOnTeam: TeamPlayer }>(CREATE_PLAYER_ON_TEAM, {
    refetchQueries: [{ query: TEAM_PLAYERS, variables: { teamId: currentTeamId } }],
  });

  const [removePlayerMutation] = useMutation(REMOVE_PLAYER_FROM_TEAM, {
    refetchQueries: [
      { query: TEAM_PLAYERS, variables: { teamId: currentTeamId } },
      { query: TEAM_PLAYERS_FULL, variables: { teamId: currentTeamId } },
    ],
  });

  const hasLocalData = () => {
    if (currentTeamId) return false;
    return players.length > 0;
  };

  const handleTeamSelected = (teamId: string | null, teamName: string | null) => {
    setCurrentTeam(teamId, teamName);
  };

  const handleTeamCreated = (team: Team) => {
    if (hasLocalData()) {
      setPendingTeam(team);
      setImportDialogOpen(true);
    } else {
      setCurrentTeam(team.id, team.name);
    }
  };

  const handleImportAccepted = async () => {
    if (!pendingTeam) return;
    setImporting(true);

    try {
      const idMap: Record<string, string> = {};

      for (const player of players) {
        const result = await createPlayer({
          variables: { teamId: pendingTeam.id, name: player.name },
          refetchQueries: [],
        });
        const serverPlayer = result.data?.createPlayerOnTeam;
        if (serverPlayer) {
          idMap[player.id] = serverPlayer.id;
        }
      }

      migrateToTeam(pendingTeam.id, idMap);
    } finally {
      setImporting(false);
      setImportDialogOpen(false);
      setPendingTeam(null);
    }
  };

  const handleImportDeclined = () => {
    if (pendingTeam) {
      setCurrentTeam(pendingTeam.id, pendingTeam.name);
    }
    setImportDialogOpen(false);
    setPendingTeam(null);
  };

  const handleAddPlayer = async (name: string) => {
    if (!currentTeamId) return;
    await createPlayer({ variables: { teamId: currentTeamId, name } });
  };

  const handleRemovePlayer = (playerId: string) => {
    setRemoveConfirmPlayer(playerId);
  };

  const handleConfirmRemove = async () => {
    if (!currentTeamId || !removeConfirmPlayer) return;
    await removePlayerMutation({ variables: { playerId: removeConfirmPlayer, teamId: currentTeamId } });
    setRemoveConfirmPlayer(null);
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

  const localDataSummary = () => {
    const parts: string[] = [];
    parts.push(`${players.length} player${players.length !== 1 ? 's' : ''}`);
    if (battingOrder.length > 0) {
      parts.push(`a batting order`);
    }
    const inningsWithPositions = innings.filter(
      (inn) => Object.keys(inn.positions).length > 0
    ).length;
    if (inningsWithPositions > 0) {
      parts.push(
        `${inningsWithPositions} inning${inningsWithPositions !== 1 ? 's' : ''} with position assignments`
      );
    }
    return parts.join(', ');
  };

  return (
    <Box>
      <TeamSelector
        currentTeamId={currentTeamId}
        onTeamSelected={handleTeamSelected}
        onTeamCreated={handleTeamCreated}
      />

      {currentTeamId && (
        <>
          {syncError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load roster: {syncError.message}
            </Alert>
          )}

          {syncLoading && players.length === 0 ? (
            <Paper
              elevation={2}
              sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'center' }}
            >
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

      <Dialog
        open={!!removeConfirmPlayer}
        onClose={() => setRemoveConfirmPlayer(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remove Player from Roster?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This player will be removed from the active roster and from any draft lineups.
            Published lineups will preserve the player's data for historical accuracy.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveConfirmPlayer(null)}>Cancel</Button>
          <Button onClick={handleConfirmRemove} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={importDialogOpen}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Existing Players?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You currently have {localDataSummary()} set up locally. Would you
            like to import them into <strong>{pendingTeam?.name}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 1 }}>
            If you choose not to import, your current lineup data will be
            cleared and you can start fresh with the new team.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportDeclined} disabled={importing}>
            Start Fresh
          </Button>
          <Button
            variant="contained"
            onClick={handleImportAccepted}
            disabled={importing}
          >
            {importing ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} />
                Importing...
              </>
            ) : (
              'Import Players'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TeamManagement;
