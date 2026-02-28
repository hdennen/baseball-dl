import { Box, Typography } from '@mui/material';
import type { WebGameContext } from '../../types';

interface GameContextHeaderProps {
  gameContext: WebGameContext | null;
}

const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

function GameContextHeader({ gameContext }: GameContextHeaderProps) {
  if (!gameContext) return null;

  const { date, time, opponent, location, side, notes } = gameContext;

  const parts = [
    date && formatDate(date),
    time && formatTime(time),
    opponent && `vs. ${opponent}`,
    location,
    side && side.toUpperCase(),
  ].filter(Boolean);

  if (parts.length === 0 && !notes) return null;

  return (
    <Box
      sx={{
        mb: 2,
        '@media print': { mb: 0.5 },
      }}
    >
      {parts.length > 0 && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            letterSpacing: 0.3,
            '@media print': { fontSize: '0.7rem' },
          }}
        >
          {parts.join(' · ')}
        </Typography>
      )}
      {notes && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
            fontStyle: 'italic',
            '@media print': { fontSize: '0.65rem', mt: 0.25 },
          }}
        >
          {notes}
        </Typography>
      )}
    </Box>
  );
}

export default GameContextHeader;
