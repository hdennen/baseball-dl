import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { AutoAwesome as GenerateIcon } from '@mui/icons-material';
import useBaseballStore from '../store/useBaseballStore';

interface GeneratePositionsModalProps {
  open: boolean;
  onClose: () => void;
}

function GeneratePositionsModal({ open, onClose }: GeneratePositionsModalProps) {
  const { innings, generatePositionsForAllInnings, getAvailablePlayers } = useBaseballStore();
  const availablePlayers = getAvailablePlayers();
  const [inningCount, setInningCount] = useState(6);
  const [useCurrentFieldConfig, setUseCurrentFieldConfig] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (availablePlayers.length === 0) {
      setError('No players available. Please add players first.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      await generatePositionsForAllInnings(inningCount, useCurrentFieldConfig);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate positions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GenerateIcon color="primary" />
          Generate Positions for All Innings
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This will generate random position assignments for all innings based on your field configuration.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available Players: {availablePlayers.length} | Current Innings: {innings.length}
            </Typography>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Number of Innings</InputLabel>
            <Select
              value={inningCount}
              label="Number of Innings"
              onChange={(e: SelectChangeEvent<number>) => setInningCount(Number(e.target.value))}
            >
              {[3, 4, 5, 6, 7, 8, 9].map((num) => (
                <MenuItem key={num} value={num}>
                  {num} Inning{num !== 1 ? 's' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useCurrentFieldConfig}
                  onChange={(e) => setUseCurrentFieldConfig(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">
                    Use current field configuration
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Apply the current inning's field config to all generated innings
                  </Typography>
                </Box>
              }
            />
          </FormGroup>

          {!useCurrentFieldConfig && (
            <Alert severity="info">
              Each inning will use the default field configuration (Center Field only).
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={isGenerating}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          startIcon={<GenerateIcon />}
          disabled={isGenerating || availablePlayers.length === 0}
        >
          {isGenerating ? 'Generating...' : 'Generate Positions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GeneratePositionsModal;
