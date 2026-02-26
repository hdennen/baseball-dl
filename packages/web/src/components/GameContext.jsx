import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import useBaseballStore from '../store/useBaseballStore';

function GameContext() {
  const { gameContext, updateGameContext } = useBaseballStore();

  const handleChange = (field) => (e) => {
    updateGameContext({ [field]: e.target.value || null });
  };

  const handleSideChange = (_, newSide) => {
    updateGameContext({ side: newSide });
  };

  return (
    <Accordion disableGutters elevation={2} sx={{ mb: 3 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h5">Game Details</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2, alignSelf: 'center' }}>
          optional
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={gameContext.date ?? ''}
            onChange={handleChange('date')}
          />
          <TextField
            label="Time"
            type="time"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={gameContext.time ?? ''}
            onChange={handleChange('time')}
          />
          <TextField
            label="Opponent"
            size="small"
            value={gameContext.opponent ?? ''}
            onChange={handleChange('opponent')}
          />
          <TextField
            label="Location"
            size="small"
            value={gameContext.location ?? ''}
            onChange={handleChange('location')}
          />
          <ToggleButtonGroup
            value={gameContext.side}
            exclusive
            onChange={handleSideChange}
            size="small"
            aria-label="home or away"
          >
            <ToggleButton value="home">Home</ToggleButton>
            <ToggleButton value="away">Away</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <TextField
          label="Notes"
          multiline
          rows={3}
          fullWidth
          size="small"
          value={gameContext.notes ?? ''}
          onChange={handleChange('notes')}
          sx={{ mt: 2 }}
        />
      </AccordionDetails>
    </Accordion>
  );
}

export default GameContext;
