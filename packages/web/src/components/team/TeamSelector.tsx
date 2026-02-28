import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client/react';
import { MY_TEAMS, CREATE_TEAM } from '../../graphql/operations';
import type { Team } from '@baseball-dl/shared';

interface TeamSelectorProps {
  currentTeamId: string | null;
  onTeamSelected: (teamId: string | null, teamName: string | null) => void;
  onTeamCreated: (team: Team) => void;
}

function TeamSelector({ currentTeamId, onTeamSelected, onTeamCreated }: TeamSelectorProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const { data, loading, error } = useQuery<{ myTeams: Team[] }>(MY_TEAMS);

  const [createTeam, { loading: creating }] = useMutation<{ createTeam: Team }>(CREATE_TEAM, {
    refetchQueries: [{ query: MY_TEAMS }],
    onCompleted: (result) => {
      onTeamCreated(result.createTeam);
      setCreateDialogOpen(false);
      setNewTeamName('');
    },
  });

  const handleTeamChange = (teamId: string) => {
    if (teamId === '') {
      onTeamSelected(null, null);
    } else {
      const team = teams.find((t) => t.id === teamId);
      onTeamSelected(teamId, team?.name ?? null);
    }
  };

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      createTeam({ variables: { name: newTeamName.trim() } });
    }
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Alert severity="error">Failed to load teams: {error.message}</Alert>
      </Paper>
    );
  }

  const teams = data?.myTeams ?? [];

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Select Team
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <FormControl fullWidth size="small">
          <InputLabel id="team-select-label">Team</InputLabel>
          <Select
            labelId="team-select-label"
            value={currentTeamId ?? ''}
            label="Team"
            onChange={(e) => handleTeamChange(e.target.value)}
          >
            <MenuItem value="">
              <em>None (local mode)</em>
            </MenuItem>
            {teams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ minWidth: 160, whiteSpace: 'nowrap' }}
        >
          New Team
        </Button>
      </Box>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Team Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateTeam();
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateTeam}
            disabled={!newTeamName.trim() || creating}
          >
            {creating ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default TeamSelector;
