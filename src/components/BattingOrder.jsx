import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Button,
  Divider,
} from '@mui/material';
import { 
  DragIndicator as DragIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Shuffle as ShuffleIcon,
  Clear as ClearIcon,
  PlaylistAdd as PlaylistAddIcon
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove as arrayMoveSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useBaseballStore from '../store/useBaseballStore';

// Sortable item component for batting order
function SortableBattingOrderItem({ player, order, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 1,
        bgcolor: 'background.paper',
        '&:hover': {
          bgcolor: 'grey.50',
        },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          color: 'grey.500',
          '&:hover': {
            color: 'primary.main',
          },
        }}
      >
        <DragIcon fontSize="small" />
      </Box>
      
      <Box
        sx={{
          minWidth: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '0.875rem',
        }}
      >
        {order}
      </Box>
      
      <Typography variant="body1" sx={{ flexGrow: 1 }}>
        {player.name}
      </Typography>
      
      <Button
        size="small"
        color="error"
        onClick={() => onRemove(player.id)}
        sx={{ minWidth: 'auto', p: 0.5 }}
      >
        <RemoveIcon fontSize="small" />
      </Button>
    </Box>
  );
}

// Available players component
function AvailablePlayers({ players, onAdd }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Available Players
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {players.map((player) => (
          <Chip
            key={player.id}
            label={player.name}
            onClick={() => onAdd(player.id)}
            icon={<AddIcon />}
            color="primary"
            variant="outlined"
            clickable
          />
        ))}
      </Stack>
    </Box>
  );
}

function BattingOrder() {
  const {
    players,
    battingOrder,
    getBattingOrderWithPlayers,
    addToBattingOrder,
    removeFromBattingOrder,
    reorderBattingOrder,
    setBattingOrder,
  } = useBaseballStore();

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const battingOrderWithPlayers = getBattingOrderWithPlayers();
  const availablePlayers = players.filter(
    (player) => !battingOrder.includes(player.id)
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = battingOrder.indexOf(active.id);
      const newIndex = battingOrder.indexOf(over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderBattingOrder(oldIndex, newIndex);
      }
    }
  };

  const handleAddPlayer = (playerId) => {
    addToBattingOrder(playerId);
  };

  const handleRemovePlayer = (playerId) => {
    removeFromBattingOrder(playerId);
  };

  const handleShuffleOrder = () => {
    const shuffled = [...battingOrder].sort(() => Math.random() - 0.5);
    setBattingOrder(shuffled);
  };

  const handleClearOrder = () => {
    setBattingOrder([]);
  };

  const handleAddAllPlayers = () => {
    const allPlayerIds = players.map(player => player.id);
    setBattingOrder(allPlayerIds);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Batting Order
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PlaylistAddIcon />}
            onClick={handleAddAllPlayers}
            disabled={players.length === 0}
            size="small"
          >
            Add All
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShuffleIcon />}
            onClick={handleShuffleOrder}
            disabled={battingOrder.length < 2}
            size="small"
          >
            Shuffle
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={handleClearOrder}
            disabled={battingOrder.length === 0}
            size="small"
          >
            Clear
          </Button>
        </Box>
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <AvailablePlayers
          players={availablePlayers}
          onAdd={handleAddPlayer}
        />

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Batting Order
          </Typography>
          {battingOrderWithPlayers.length === 0 ? (
            <Box
              sx={{
                p: 3,
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 1,
                textAlign: 'center',
                bgcolor: 'grey.50',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No players in batting order. Add players from the available players above.
              </Typography>
            </Box>
          ) : (
            <SortableContext
              items={battingOrder}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={1}>
                {battingOrderWithPlayers.map((item) => (
                  <SortableBattingOrderItem
                    key={item.playerId}
                    player={item.player}
                    order={item.order}
                    onRemove={handleRemovePlayer}
                  />
                ))}
              </Stack>
            </SortableContext>
          )}
        </Box>
      </DndContext>
    </Paper>
  );
}

export default BattingOrder;
