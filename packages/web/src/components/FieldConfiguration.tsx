import { Box, FormGroup, FormControlLabel, Checkbox, Typography } from '@mui/material';
import useBaseballStore from '../store/useBaseballStore';
import type { FieldConfig } from '../types';

function FieldConfiguration() {
  const { innings, currentInningIndex, toggleFieldPosition } = useBaseballStore();
  
  const currentInning = innings[currentInningIndex];
  const fieldConfig: FieldConfig = currentInning?.fieldConfig || {
    'center-field': true,
    'center-left-field': false,
    'center-right-field': false,
  };

  const handleToggle = (position: keyof FieldConfig) => {
    toggleFieldPosition(position);
  };

  return (
    <Box sx={{ 
      bgcolor: 'background.paper', 
      borderBottom: 1, 
      borderColor: 'divider',
      px: 3,
      py: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      flexWrap: 'wrap'
    }}>
      <Typography variant="body2" fontWeight="medium" color="text.secondary">
        Outfield Config:
      </Typography>
      
      <FormGroup row sx={{ gap: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={fieldConfig['center-field']}
              onChange={() => handleToggle('center-field')}
              size="small"
            />
          }
          label={<Typography variant="body2">Center Field</Typography>}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={fieldConfig['center-left-field']}
              onChange={() => handleToggle('center-left-field')}
              size="small"
            />
          }
          label={<Typography variant="body2">Center Left Field</Typography>}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={fieldConfig['center-right-field']}
              onChange={() => handleToggle('center-right-field')}
              size="small"
            />
          }
          label={<Typography variant="body2">Center Right Field</Typography>}
        />
      </FormGroup>
    </Box>
  );
}

export default FieldConfiguration;

