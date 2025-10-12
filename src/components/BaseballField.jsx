import { Box, Paper, Typography, Chip, Button } from '@mui/material';
import { Shuffle as ShuffleIcon } from '@mui/icons-material';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import useBaseballStore from '../store/useBaseballStore';

function DraggablePlayer({ player, position }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    data: {
      player,
      position,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Chip
        label={player.name}
        color="success"
        size="small"
        sx={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      />
    </Box>
  );
}

function PositionSlot({ position, player }) {
  const { getPositionLabel } = useBaseballStore();
  const label = getPositionLabel(position);

  const { setNodeRef, isOver } = useDroppable({
    id: `position-${position}`,
    data: {
      type: 'position',
      position,
    },
  });

  return (
    <Paper
      ref={setNodeRef}
      elevation={isOver ? 6 : 2}
      sx={{
        p: 2,
        minHeight: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: '2px solid',
        borderColor: isOver ? 'primary.main' : 'transparent',
        bgcolor: isOver ? 'action.hover' : 'background.paper',
        transition: 'all 0.2s',
      }}
    >
      <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      
      {player ? (
        <DraggablePlayer player={player} position={position} />
      ) : (
        <Typography variant="body2" color="text.disabled">
          Empty
        </Typography>
      )}
    </Paper>
  );
}

function BenchPlayer({ player, index }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    data: {
      player,
      fromBench: true,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Chip
        label={player.name}
        color="warning"
        variant="outlined"
        size="medium"
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      />
    </Box>
  );
}

function BaseballField() {
  const { innings, currentInningIndex, players, getBenchedPlayers, randomlyAssignPlayers } = useBaseballStore();
  
  const currentInning = innings[currentInningIndex] || { positions: {} };
  const benchedPlayers = getBenchedPlayers(currentInningIndex);

  // Get player object for each position
  const getPlayerForPosition = (position) => {
    const playerId = currentInning.positions[position];
    return players.find((p) => p.id === playerId);
  };

  const { setNodeRef: setBenchRef, isOver: isBenchOver } = useDroppable({
    id: 'bench',
    data: {
      type: 'bench',
    },
  });

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Inning {currentInningIndex + 1} - Field Positions
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ShuffleIcon />}
          onClick={randomlyAssignPlayers}
          disabled={players.length === 0}
          size="small"
        >
          Random Positions
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 3, maxWidth: 1400, mx: 'auto', alignItems: 'flex-start' }}>
        {/* Baseball Field with Positioned Slots */}
        <Box sx={{ flex: 1, position: 'relative', height: 700 }}>
          {/* Baseball Diamond Background */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 400,
              height: 400,
              transform: 'translate(-50%, -40%) rotate(45deg)',
              border: '3px solid black',
              zIndex: 0,
            }}
          />

          {/* Foul lines */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '10%',
              left: '50%',
              width: '45%',
              height: '2px',
              bgcolor: 'black',
              transform: 'rotate(-45deg)',
              transformOrigin: 'left center',
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '10%',
              right: '50%',
              width: '45%',
              height: '2px',
              bgcolor: 'black',
              transform: 'rotate(45deg)',
              transformOrigin: 'right center',
              zIndex: 0,
            }}
          />

          {/* Outfield Arc */}
          <Box
            sx={{
              position: 'absolute',
              top: '8%',
              left: '50%',
              width: 600,
              height: 300,
              transform: 'translateX(-50%)',
              borderTop: '2px solid black',
              borderRadius: '300px 300px 0 0',
              zIndex: 0,
            }}
          />

          {/* Position Slots - Absolutely positioned */}
          <Box sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
            {/* Outfield */}
            <Box sx={{ position: 'absolute', left: '8%', top: '15%' }}>
              <PositionSlot
                position="left-field"
                player={getPlayerForPosition('left-field')}
              />
            </Box>
            <Box sx={{ position: 'absolute', left: '25%', top: '8%' }}>
              <PositionSlot
                position="center-left-field"
                player={getPlayerForPosition('center-left-field')}
              />
            </Box>
            <Box sx={{ position: 'absolute', left: '50%', top: '5%', transform: 'translateX(-50%)' }}>
              <PositionSlot
                position="center-field"
                player={getPlayerForPosition('center-field')}
              />
            </Box>
            <Box sx={{ position: 'absolute', right: '25%', top: '8%' }}>
              <PositionSlot
                position="center-right-field"
                player={getPlayerForPosition('center-right-field')}
              />
            </Box>
            <Box sx={{ position: 'absolute', right: '8%', top: '15%' }}>
              <PositionSlot
                position="right-field"
                player={getPlayerForPosition('right-field')}
              />
            </Box>

            {/* Infield - Left side (3B-SS line) */}
            <Box sx={{ position: 'absolute', left: '15%', top: '48%' }}>
              <PositionSlot
                position="third-base"
                player={getPlayerForPosition('third-base')}
              />
            </Box>
            <Box sx={{ position: 'absolute', left: '32%', top: '38%' }}>
              <PositionSlot
                position="shortstop"
                player={getPlayerForPosition('shortstop')}
              />
            </Box>

            {/* Infield - Right side (2B-1B line) */}
            <Box sx={{ position: 'absolute', right: '32%', top: '38%' }}>
              <PositionSlot
                position="second-base"
                player={getPlayerForPosition('second-base')}
              />
            </Box>
            <Box sx={{ position: 'absolute', right: '15%', top: '48%' }}>
              <PositionSlot
                position="first-base"
                player={getPlayerForPosition('first-base')}
              />
            </Box>

            {/* Pitcher - Center */}
            <Box sx={{ position: 'absolute', left: '50%', top: '48%', transform: 'translateX(-50%)' }}>
              <PositionSlot
                position="pitcher"
                player={getPlayerForPosition('pitcher')}
              />
            </Box>

            {/* Catcher - Home */}
            <Box sx={{ position: 'absolute', left: '50%', bottom: '5%', transform: 'translateX(-50%)' }}>
              <PositionSlot
                position="catcher"
                player={getPlayerForPosition('catcher')}
              />
            </Box>
          </Box>
        </Box>

        {/* Bench - Right Sidebar */}
        <Box sx={{ width: 280, flexShrink: 0 }}>
          <Typography variant="h6" gutterBottom color="warning.main">
            Bench
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Drag players to field positions
          </Typography>
          <Paper
            ref={setBenchRef}
            variant="outlined"
            sx={{
              p: 2,
              height: 700,
              maxHeight: 700,
              overflowY: 'auto',
              bgcolor: isBenchOver ? 'warning.50' : 'grey.50',
              border: '2px solid',
              borderColor: isBenchOver ? 'warning.main' : 'grey.300',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'all 0.2s',
            }}
          >
            {benchedPlayers.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                All players are assigned to positions
              </Typography>
            ) : (
              benchedPlayers.map((player, index) => (
                <BenchPlayer key={player.id} player={player} index={index} />
              ))
            )}
          </Paper>
        </Box>
      </Box>
    </Paper>
  );
}

export default BaseballField;
