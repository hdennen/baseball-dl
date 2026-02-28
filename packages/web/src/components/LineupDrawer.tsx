import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  IconButton,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  ContentCopy as CloneIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { TEAM_LINEUPS, DELETE_LINEUP } from '../graphql/operations';
import useBaseballStore from '../store/useBaseballStore';
import type { Lineup } from '../types/index';

interface LineupDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface GqlInning {
  positions: Record<string, string>;
  fieldConfig: {
    centerField: boolean;
    centerLeftField: boolean;
    centerRightField: boolean;
  };
}

interface GqlLineup {
  id: string;
  teamId: string;
  gameContext: {
    dateTime: string | null;
    opponent: string | null;
    location: string | null;
    side: 'home' | 'away' | null;
    notes: string | null;
  } | null;
  availablePlayerIds: string[];
  battingOrder: string[];
  innings: GqlInning[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

function normalizeGqlLineup(gql: GqlLineup): Lineup {
  return {
    id: gql.id,
    teamId: gql.teamId,
    gameContext: {
      dateTime: gql.gameContext?.dateTime ?? null,
      opponent: gql.gameContext?.opponent ?? null,
      location: gql.gameContext?.location ?? null,
      side: gql.gameContext?.side ?? null,
      notes: gql.gameContext?.notes ?? null,
    },
    availablePlayerIds: gql.availablePlayerIds,
    battingOrder: gql.battingOrder,
    innings: gql.innings.map((inn) => ({
      positions: inn.positions,
      fieldConfig: {
        'center-field': inn.fieldConfig.centerField,
        'center-left-field': inn.fieldConfig.centerLeftField,
        'center-right-field': inn.fieldConfig.centerRightField,
      },
    })),
    status: gql.status,
    createdBy: '',
    createdAt: gql.createdAt,
    updatedAt: gql.updatedAt,
  };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function LineupDrawer({ open, onClose }: LineupDrawerProps) {
  const { currentTeamId, currentLineupId, loadLineup, clearLineup } = useBaseballStore();
  const [deleteTarget, setDeleteTarget] = useState<GqlLineup | null>(null);

  const { data, loading, error } = useQuery<{ teamLineups: GqlLineup[] }>(
    TEAM_LINEUPS,
    {
      variables: { teamId: currentTeamId },
      skip: !currentTeamId || !open,
      fetchPolicy: 'cache-and-network',
    }
  );

  const [deleteLineup, { loading: deleting }] = useMutation(DELETE_LINEUP, {
    refetchQueries: [{ query: TEAM_LINEUPS, variables: { teamId: currentTeamId } }],
  });

  const lineups = data?.teamLineups ?? [];

  const handleLoad = (gqlLineup: GqlLineup) => {
    loadLineup(normalizeGqlLineup(gqlLineup));
    onClose();
  };

  const handleClone = (gqlLineup: GqlLineup) => {
    const normalized = normalizeGqlLineup(gqlLineup);
    loadLineup({ ...normalized, id: '', status: 'draft' });
    useBaseballStore.setState({ currentLineupId: null, currentLineupStatus: 'draft' });
    onClose();
  };

  const handleNewLineup = () => {
    clearLineup();
    onClose();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLineup({ variables: { id: deleteTarget.id } });
      if (currentLineupId === deleteTarget.id) {
        clearLineup();
      }
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 380 } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Team Lineups</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        <Box sx={{ p: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            fullWidth
            onClick={handleNewLineup}
          >
            New Lineup
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mx: 2 }}>Failed to load lineups</Alert>
        )}

        {!loading && lineups.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 4, textAlign: 'center' }}>
            No saved lineups yet. Create one and save it to see it here.
          </Typography>
        )}

        <List sx={{ flex: 1, overflow: 'auto' }}>
          {lineups.map((lineup) => {
            const isActive = currentLineupId === lineup.id;
            const opponent = lineup.gameContext?.opponent || 'No opponent';
            const date = formatDate(lineup.gameContext?.dateTime);

            return (
              <ListItem
                key={lineup.id}
                disablePadding
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Clone as draft">
                      <IconButton size="small" onClick={() => handleClone(lineup)}>
                        <CloneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {lineup.status === 'draft' && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteTarget(lineup)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                }
              >
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleLoad(lineup)}
                  sx={{ pr: 10 }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" noWrap sx={{ flex: 1 }}>
                          {opponent}
                        </Typography>
                        <Chip
                          label={lineup.status === 'published' ? 'Published' : 'Draft'}
                          color={lineup.status === 'published' ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {date && `${date} · `}
                        {lineup.innings.length} inning{lineup.innings.length !== 1 ? 's' : ''}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Lineup?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete the lineup vs {deleteTarget?.gameContext?.opponent || 'unknown opponent'}? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
