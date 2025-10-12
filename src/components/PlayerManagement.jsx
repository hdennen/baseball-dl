import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import useBaseballStore from '../store/useBaseballStore';

function PlayerManagement() {
  const [playerName, setPlayerName] = useState('');
  const { players, addPlayer, removePlayer } = useBaseballStore();

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      addPlayer(playerName.trim());
      setPlayerName('');
    }
  };

  const handleKeyPress = (e) => {
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
          label="Player Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPlayer}
          disabled={!playerName.trim()}
        >
          Add Player
        </Button>
      </Box>

      <Droppable droppableId="player-pool">
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              minHeight: 60,
              p: 2,
              border: '2px dashed',
              borderColor: snapshot.isDraggingOver ? 'primary.main' : 'grey.300',
              borderRadius: 1,
              bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            {players.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center">
                No players added yet. Add players above to get started.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {players.map((player, index) => (
                  <Draggable key={player.id} draggableId={player.id} index={index}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{ mb: 1 }}
                      >
                        <Chip
                          label={player.name}
                          onDelete={() => removePlayer(player.id)}
                          deleteIcon={<DeleteIcon />}
                          color="primary"
                          variant={snapshot.isDragging ? 'filled' : 'outlined'}
                          sx={{
                            opacity: snapshot.isDragging ? 0.5 : 1,
                            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                          }}
                        />
                      </Box>
                    )}
                  </Draggable>
                ))}
              </Stack>
            )}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
}

export default PlayerManagement;

