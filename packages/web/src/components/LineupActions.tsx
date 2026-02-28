import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Publish as PublishIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';
import { SAVE_LINEUP, TEAM_LINEUPS } from '../graphql/operations';
import useBaseballStore from '../store/useBaseballStore';
import type { LineupStatus } from '../types';

interface SaveLineupResult {
  saveLineup: {
    id: string;
    status: LineupStatus;
  };
}

function buildDateTime(date: string | null, time: string | null): string | null {
  if (!date) return null;
  if (time) return `${date}T${time}:00`;
  return `${date}T00:00:00`;
}

export default function LineupActions() {
  const {
    currentTeamId,
    currentLineupId,
    currentLineupStatus,
    battingOrder,
    unavailablePlayers,
    innings,
    gameContext,
    players,
    setLineupMeta,
  } = useBaseballStore();

  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [saveLineup, { loading: saving }] = useMutation<SaveLineupResult>(SAVE_LINEUP, {
    refetchQueries: [{ query: TEAM_LINEUPS, variables: { teamId: currentTeamId } }],
  });

  const isPublished = currentLineupStatus === 'published';
  const isSaved = !!currentLineupId;

  const assembleInput = (status: 'draft' | 'published', idOverride?: string | null) => {
    const availablePlayerIds = players
      .filter((p) => !unavailablePlayers.includes(p.id))
      .map((p) => p.id);

    return {
      ...(idOverride !== null && (idOverride || currentLineupId)
        ? { id: idOverride || currentLineupId }
        : {}),
      teamId: currentTeamId,
      gameContext: {
        dateTime: buildDateTime(gameContext.date, gameContext.time),
        opponent: gameContext.opponent,
        location: gameContext.location,
        side: gameContext.side,
        notes: gameContext.notes,
      },
      availablePlayerIds,
      battingOrder,
      innings: innings.map((inn) => ({
        positions: inn.positions,
        fieldConfig: {
          centerField: inn.fieldConfig['center-field'],
          centerLeftField: inn.fieldConfig['center-left-field'],
          centerRightField: inn.fieldConfig['center-right-field'],
        },
      })),
      status,
    };
  };

  const handleSaveDraft = async () => {
    try {
      const { data } = await saveLineup({ variables: { input: assembleInput('draft') } });
      if (!data) throw new Error('No data returned');
      setLineupMeta(data.saveLineup.id, data.saveLineup.status);
      setSnackbar({ open: true, message: 'Lineup saved as draft', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save lineup', severity: 'error' });
    }
  };

  const handlePublish = async () => {
    setPublishConfirmOpen(false);
    try {
      const { data } = await saveLineup({ variables: { input: assembleInput('published') } });
      if (!data) throw new Error('No data returned');
      setLineupMeta(data.saveLineup.id, data.saveLineup.status);
      setSnackbar({ open: true, message: 'Lineup published', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to publish lineup', severity: 'error' });
    }
  };

  const handleDuplicate = async () => {
    try {
      const { data } = await saveLineup({ variables: { input: assembleInput('draft', null) } });
      if (!data) throw new Error('No data returned');
      setLineupMeta(data.saveLineup.id, data.saveLineup.status);
      setSnackbar({ open: true, message: 'Duplicated as new draft', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to duplicate lineup', severity: 'error' });
    }
  };

  const statusLabel = isPublished
    ? 'Published'
    : isSaved
      ? 'Draft'
      : 'Unsaved';

  const statusColor = isPublished
    ? 'success' as const
    : isSaved
      ? 'info' as const
      : 'warning' as const;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip label={statusLabel} color={statusColor} size="small" variant="outlined" />

        {!isPublished && (
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveDraft}
              disabled={saving}
            >
              Save Draft
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<PublishIcon />}
              onClick={() => setPublishConfirmOpen(true)}
              disabled={saving}
            >
              Publish
            </Button>
          </>
        )}

        {isPublished && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<DuplicateIcon />}
            onClick={handleDuplicate}
            disabled={saving}
          >
            Duplicate as Draft
          </Button>
        )}
      </Box>

      <Dialog open={publishConfirmOpen} onClose={() => setPublishConfirmOpen(false)}>
        <DialogTitle>Publish Lineup?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Publishing makes this lineup visible to team members and locks it from further editing.
            You can always duplicate it later to create a new draft.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handlePublish} variant="contained">Publish</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
