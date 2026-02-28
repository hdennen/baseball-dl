import { useState } from 'react';
import { Paper, Box, Typography, Button, Alert, Divider } from '@mui/material';
import { History as HistoryIcon, Add as AddIcon } from '@mui/icons-material';
import useBaseballStore from '../store/useBaseballStore';
import LineupActions from './LineupActions';
import LineupDrawer from './LineupDrawer';

function formatLineupLabel(opponent: string | null, date: string | null): string {
  const parts: string[] = [];
  if (opponent) parts.push(`vs ${opponent}`);
  if (date) {
    try {
      const d = new Date(date + 'T00:00:00');
      parts.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    } catch {
      parts.push(date);
    }
  }
  return parts.length > 0 ? parts.join(' \u2014 ') : 'New Lineup';
}

export default function TeamLineupBar() {
  const { currentTeamName, currentLineupStatus, gameContext, clearLineup } = useBaseballStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isPublished = currentLineupStatus === 'published';

  const lineupLabel = formatLineupLabel(gameContext.opponent, gameContext.date);

  return (
    <Paper
      elevation={2}
      className="no-print"
      sx={{ mb: 3, overflow: 'hidden' }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            {currentTeamName ?? 'Team'}
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="text.secondary" noWrap>
            {lineupLabel}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        <LineupActions />

        <Divider orientation="vertical" flexItem />

        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={clearLineup}
        >
          New
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => setDrawerOpen(true)}
        >
          Lineups
        </Button>
      </Box>

      {isPublished && (
        <Alert severity="info" sx={{ borderRadius: 0 }}>
          This lineup has been published and is read-only. Duplicate it to make changes.
        </Alert>
      )}

      <LineupDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Paper>
  );
}
