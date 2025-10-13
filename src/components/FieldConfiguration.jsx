import { Box, Paper, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import useBaseballStore from '../store/useBaseballStore';

function FieldConfiguration() {
  const { innings, currentInningIndex, toggleFieldPosition } = useBaseballStore();
  
  const currentInning = innings[currentInningIndex];
  const fieldConfig = currentInning?.fieldConfig || {
    'center-field': true,
    'center-left-field': false,
    'center-right-field': false,
  };

  const handleToggle = (position) => {
    toggleFieldPosition(position);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Field Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Toggle outfield positions for this inning. Players in disabled positions will be moved to the bench.
      </Typography>
      
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={fieldConfig['center-field']}
              onChange={() => handleToggle('center-field')}
            />
          }
          label="Center Field"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={fieldConfig['center-left-field']}
              onChange={() => handleToggle('center-left-field')}
            />
          }
          label="Center Left Field (Little League)"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={fieldConfig['center-right-field']}
              onChange={() => handleToggle('center-right-field')}
            />
          }
          label="Center Right Field (Little League)"
        />
      </FormGroup>
    </Paper>
  );
}

export default FieldConfiguration;

