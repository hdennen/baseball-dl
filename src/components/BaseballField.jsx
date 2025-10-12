import { Box, Paper, Typography, Chip, Grid } from '@mui/material';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import useBaseballStore from '../store/useBaseballStore';
import { POSITIONS } from '../store/useBaseballStore';

function PositionSlot({ position, player, index }) {
  const { getPositionLabel } = useBaseballStore();
  const label = getPositionLabel(position);

  return (
    <Droppable droppableId={`position-${position}`}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.droppableProps}
          elevation={snapshot.isDraggingOver ? 6 : 2}
          sx={{
            p: 2,
            minHeight: 80,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '2px solid',
            borderColor: snapshot.isDraggingOver ? 'primary.main' : 'transparent',
            bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s',
          }}
        >
          <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
            {label}
          </Typography>
          
          {player ? (
            <Draggable draggableId={player.id} index={index}>
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                >
                  <Chip
                    label={player.name}
                    color="success"
                    size="small"
                    sx={{
                      opacity: snapshot.isDragging ? 0.5 : 1,
                    }}
                  />
                </Box>
              )}
            </Draggable>
          ) : (
            <Typography variant="body2" color="text.disabled">
              Empty
            </Typography>
          )}
          
          {provided.placeholder}
        </Paper>
      )}
    </Droppable>
  );
}

function BaseballField() {
  const { innings, currentInningIndex, players, getBenchedPlayers } = useBaseballStore();
  
  const currentInning = innings[currentInningIndex] || { positions: {} };
  const benchedPlayers = getBenchedPlayers(currentInningIndex);

  // Get player object for each position
  const getPlayerForPosition = (position) => {
    const playerId = currentInning.positions[position];
    return players.find((p) => p.id === playerId);
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom align="center">
        Inning {currentInningIndex + 1} - Field Positions
      </Typography>
      
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Outfield */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Outfield
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <PositionSlot
                position="left-field"
                player={getPlayerForPosition('left-field')}
                index={6}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <PositionSlot
                position="center-left-field"
                player={getPlayerForPosition('center-left-field')}
                index={7}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <PositionSlot
                position="center-field"
                player={getPlayerForPosition('center-field')}
                index={8}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <PositionSlot
                position="center-right-field"
                player={getPlayerForPosition('center-right-field')}
                index={9}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <PositionSlot
                position="right-field"
                player={getPlayerForPosition('right-field')}
                index={10}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Infield */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Infield
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <PositionSlot
                position="third-base"
                player={getPlayerForPosition('third-base')}
                index={5}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <PositionSlot
                position="shortstop"
                player={getPlayerForPosition('shortstop')}
                index={4}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <PositionSlot
                position="second-base"
                player={getPlayerForPosition('second-base')}
                index={3}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <PositionSlot
                position="first-base"
                player={getPlayerForPosition('first-base')}
                index={2}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Battery */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Battery
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <PositionSlot
                position="pitcher"
                player={getPlayerForPosition('pitcher')}
                index={0}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PositionSlot
                position="catcher"
                player={getPlayerForPosition('catcher')}
                index={1}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Bench */}
        <Box>
          <Typography variant="h6" gutterBottom color="warning.main">
            Bench
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              minHeight: 80,
              bgcolor: 'grey.50',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {benchedPlayers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                All players are assigned to positions
              </Typography>
            ) : (
              benchedPlayers.map((player) => (
                <Chip
                  key={player.id}
                  label={player.name}
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              ))
            )}
          </Paper>
        </Box>
      </Box>
    </Paper>
  );
}

export default BaseballField;

