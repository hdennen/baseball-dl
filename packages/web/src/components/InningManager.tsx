import React, { useState } from 'react';
import {
  Box,
  Tab,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { 
  Add as AddIcon, 
  ContentCopy as CopyIcon,
  DeleteSweep as ClearIcon,
  Close as CloseIcon,
  MoreVert as MoreIcon,
  DragIndicator as DragIcon,
  AutoAwesome as GenerateIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useBaseballStore from '../store/useBaseballStore';
import GeneratePositionsModal from './GeneratePositionsModal';

interface SortableTabProps {
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  label: string;
}

function SortableTab({ index, isActive, onClick, onDelete, label }: SortableTabProps) {
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
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        {...listeners}
        {...attributes}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          px: 0.5,
          py: 1,
          touchAction: 'none',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <DragIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      </Box>
      <Tab
        label={label}
        onClick={onClick}
        sx={{
          minHeight: 48,
          textTransform: 'none',
          fontWeight: isActive ? 'bold' : 'normal',
          color: isActive ? 'primary.main' : 'text.primary',
        }}
      />
      {onDelete && (
        <IconButton
          size="small"
          onClick={onDelete}
          sx={{
            ml: -1,
            mr: 0.5,
            '&:hover': {
              color: 'error.main',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
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
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDeleteInning = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    removeInning(index);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace('inning-', ''));
      const newIndex = parseInt(String(over.id).replace('inning-', ''));
      reorderInnings(oldIndex, newIndex);
    }
  };
  
  const handleClearAll = () => {
    clearAllData();
    setConfirmDialogOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={innings.map((_, index) => `inning-${index}`)}
            strategy={horizontalListSortingStrategy}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'auto', flex: 1 }}>
              {innings.map((_, index) => (
                <SortableTab
                  key={`inning-${index}`}
                  index={index}
                  label={`Inning ${index + 1}`}
                  isActive={currentInningIndex === index}
                  onClick={() => setCurrentInning(index)}
                  onDelete={innings.length > 1 ? (e) => handleDeleteInning(index, e) : undefined}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
          <ButtonGroup size="small" variant="outlined" disabled={innings.length >= 9}>
            <Tooltip title="Add Empty Inning">
              <Button
                onClick={addEmptyInning}
                startIcon={<AddIcon />}
              >
                Empty
              </Button>
            </Tooltip>
            <Tooltip title="Add Inning with Carry-Over">
              <Button
                onClick={addInningWithCarryOver}
                disabled={innings.length === 0}
                startIcon={<CopyIcon />}
              >
                Copy
              </Button>
            </Tooltip>
          </ButtonGroup>
          
          <Tooltip title="Generate Positions for All Innings">
            <Button
              size="small"
              variant="outlined"
              startIcon={<GenerateIcon />}
              onClick={() => setGenerateModalOpen(true)}
              sx={{ ml: 1 }}
            >
              Generate
            </Button>
          </Tooltip>
          
          <Tooltip title="More Options">
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { setConfirmDialogOpen(true); handleMenuClose(); }}>
              <ListItemIcon>
                <ClearIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Clear All Data</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
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
      
      <GeneratePositionsModal 
        open={generateModalOpen} 
        onClose={() => setGenerateModalOpen(false)} 
      />
    </Box>
  );
}

export default InningManager;
