import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Chip,
  Stack,
} from '@mui/material';
import { Add as AddIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import useBaseballStore from '../store/useBaseballStore';

function InningManager() {
  const {
    innings,
    currentInningIndex,
    setCurrentInning,
    addEmptyInning,
    addInningWithCarryOver,
  } = useBaseballStore();

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Inning Management
        </Typography>
        <ButtonGroup variant="contained" size="small" disabled={innings.length >= 9}>
          <Button
            startIcon={<AddIcon />}
            onClick={addEmptyInning}
          >
            Add Empty Inning
          </Button>
          <Button
            startIcon={<CopyIcon />}
            onClick={addInningWithCarryOver}
            disabled={innings.length === 0}
          >
            Add with Carry-Over
          </Button>
        </ButtonGroup>
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {innings.map((inning, index) => (
          <Chip
            key={index}
            label={`Inning ${index + 1}`}
            onClick={() => setCurrentInning(index)}
            color={currentInningIndex === index ? 'primary' : 'default'}
            variant={currentInningIndex === index ? 'filled' : 'outlined'}
            sx={{ minWidth: 100 }}
          />
        ))}
      </Stack>

      {innings.length >= 9 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Maximum of 9 innings reached
        </Typography>
      )}
    </Paper>
  );
}

export default InningManager;

