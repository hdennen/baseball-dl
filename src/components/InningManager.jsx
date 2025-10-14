import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { 
  Add as AddIcon, 
  ContentCopy as CopyIcon, 
  DragIndicator as DragIcon,
  DeleteSweep as ClearIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useBaseballStore from '../store/useBaseballStore';

function SortableInning({ inning, index, isActive, onClick, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `inning-${index}` });

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
      }}
    >
      <Box
        {...listeners}
        {...attributes}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          mr: 0.5,
          touchAction: 'none',
        }}
      >
        <DragIcon fontSize="small" color="action" />
      </Box>
      <Chip
        label={`Inning ${index + 1}`}
        onClick={onClick}
        onDelete={onDelete}
        color={isActive ? 'primary' : 'default'}
        variant={isActive ? 'filled' : 'outlined'}
        sx={{ minWidth: 100 }}
      />
    </Box>
  );
}

function InningManager() {
  const {
    innings,
    currentInningIndex,
    setCurrentInning,
    addEmptyInning,
    addInningWithCarryOver,
    removeInning,
    reorderInnings,
    clearAllData,
  } = useBaseballStore();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDeleteInning = (index, event) => {
    event.stopPropagation(); // Prevent the chip click event from firing
    removeInning(index);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.replace('inning-', ''));
      const newIndex = parseInt(over.id.replace('inning-', ''));
      reorderInnings(oldIndex, newIndex);
    }
  };
  
  const handleClearAll = () => {
    clearAllData();
    setConfirmDialogOpen(false);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">
          Inning Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<ClearIcon />}
            onClick={() => setConfirmDialogOpen(true)}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={innings.map((_, index) => `inning-${index}`)}
          strategy={horizontalListSortingStrategy}
        >
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{
              p: 1,
              borderRadius: 1,
            }}
          >
            {innings.map((inning, index) => (
              <SortableInning
                key={`inning-${index}`}
                inning={inning}
                index={index}
                isActive={currentInningIndex === index}
                onClick={() => setCurrentInning(index)}
                onDelete={innings.length > 1 ? (e) => handleDeleteInning(index, e) : undefined}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>

      {innings.length === 1 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          At least one inning is required
        </Typography>
      )}

      {innings.length >= 9 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Maximum of 9 innings reached
        </Typography>
      )}
      
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Clear All Data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete all players, innings, and position assignments. 
            This action cannot be undone. Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClearAll} color="error" variant="contained" autoFocus>
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default InningManager;
