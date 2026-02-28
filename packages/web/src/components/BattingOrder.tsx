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
  PlaylistAdd as PlaylistAddIcon,
  PersonOff as PersonOffIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useBaseballStore from '../store/useBaseballStore';
import type { Player } from '../types';

interface SortableBattingOrderItemProps {
  player: Player;
  order: number;
  onRemove: (playerId: string) => void;
}

interface AvailablePlayersProps {
  players: Player[];
  onAdd: (playerId: string) => void;
  onMarkUnavailable: (playerId: string) => void;
}

interface UnavailablePlayersProps {
  players: Player[];
  onRestore: (playerId: string) => void;
}

function SortableBattingOrderItem({ player, order, onRemove }: SortableBattingOrderItemProps) {
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

function AvailablePlayers({ players, onAdd, onMarkUnavailable }: AvailablePlayersProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Available Players
      </Typography>
      {players.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No available players to add. Add players above or restore from unavailable below.
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {players.map((player) => (
            <Chip
              key={player.id}
              label={player.name}
              onClick={() => onAdd(player.id)}
              onDelete={() => onMarkUnavailable(player.id)}
              deleteIcon={<PersonOffIcon fontSize="small" />}
              icon={<AddIcon />}
              color="primary"
              variant="outlined"
              clickable
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function UnavailablePlayers({ players, onRestore }: UnavailablePlayersProps) {
  if (players.length === 0) return null;

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="text.secondary">
        Unavailable Players
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {players.map((player) => (
          <Chip
            key={player.id}
            label={player.name}
            onClick={() => onRestore(player.id)}
            icon={<PersonAddIcon />}
            color="default"
            variant="outlined"
            clickable
            sx={{ opacity: 0.6 }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function BattingOrder() {
  const {
    battingOrder,
    getBattingOrderWithPlayers,
    addToBattingOrder,
    removeFromBattingOrder,
    reorderBattingOrder,
    setBattingOrder,
    getAvailablePlayers,
    getUnavailablePlayerObjects,
    togglePlayerAvailability,
  } = useBaseballStore();

  const [_activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const battingOrderWithPlayers = getBattingOrderWithPlayers();
  const allAvailable = getAvailablePlayers();
  const unavailablePlayersList = getUnavailablePlayerObjects();
  const availablePlayers = allAvailable.filter(
    (player) => !battingOrder.includes(player.id)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = battingOrder.indexOf(String(active.id));
      const newIndex = battingOrder.indexOf(String(over!.id));
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderBattingOrder(oldIndex, newIndex);
      }
    }
  };

  const handleAddPlayer = (playerId: string) => {
    addToBattingOrder(playerId);
  };

  const handleRemovePlayer = (playerId: string) => {
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
    const availableIds = allAvailable.map(player => player.id);
    setBattingOrder(availableIds);
  };

  const handleMarkUnavailable = (playerId: string) => {
    togglePlayerAvailability(playerId);
  };

  const handleRestorePlayer = (playerId: string) => {
    togglePlayerAvailability(playerId);
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
            disabled={allAvailable.length === 0}
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
          onMarkUnavailable={handleMarkUnavailable}
        />

        <Divider sx={{ my: 3 }} />

        <UnavailablePlayers
          players={unavailablePlayersList}
          onRestore={handleRestorePlayer}
        />

        {unavailablePlayersList.length > 0 && <Divider sx={{ my: 3 }} />}

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
                    player={item.player!}
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
