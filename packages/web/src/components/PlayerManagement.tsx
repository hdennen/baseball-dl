import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import useBaseballStore from '../store/useBaseballStore';

function PlayerManagement() {
  const [playerName, setPlayerName] = useState('');
  const { players, addPlayer, removePlayer } = useBaseballStore();

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      // Check if input contains commas (comma-delimited list)
      if (playerName.includes(',')) {
        // Split by comma and add each player
        const names = playerName.split(',').map(name => name.trim()).filter(name => name);
        names.forEach(name => addPlayer(name));
      } else {
        // Single player
        addPlayer(playerName.trim());
      }
      setPlayerName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddPlayer();
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Player Management
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Player Name(s)"
          placeholder="Enter name or paste comma-separated names (e.g., John, Sarah, Mike)"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          helperText="Tip: Paste comma-separated names to add multiple players at once"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPlayer}
          disabled={!playerName.trim()}
          sx={{ minWidth: 120 }}
        >
          Add
        </Button>
      </Box>

      <Box
        sx={{
          minHeight: 60,
          p: 2,
          border: '2px dashed',
          borderColor: 'grey.300',
          borderRadius: 1,
          bgcolor: 'grey.50',
        }}
      >
        {players.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            No players added yet. Add players above to get started.
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {players.map((player) => (
              <Chip
                key={player.id}
                label={player.name}
                onDelete={() => removePlayer(player.id)}
                deleteIcon={<DeleteIcon />}
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Drag players from the Bench section below to assign them to positions
      </Typography>
    </Paper>
  );
}

export default PlayerManagement;

