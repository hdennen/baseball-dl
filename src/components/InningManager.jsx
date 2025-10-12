import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Chip,
  Stack,
} from '@mui/material';
import { Add as AddIcon, ContentCopy as CopyIcon, DragIndicator as DragIcon } from '@mui/icons-material';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import useBaseballStore from '../store/useBaseballStore';

function InningManager() {
  const {
    innings,
    currentInningIndex,
    setCurrentInning,
    addEmptyInning,
    addInningWithCarryOver,
    removeInning,
  } = useBaseballStore();

  const handleDeleteInning = (index, event) => {
    event.stopPropagation(); // Prevent the chip click event from firing
    removeInning(index);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Inning Management
        </Typography>
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
      </Box>

      <Droppable droppableId="innings" direction="horizontal">
        {(provided, snapshot) => (
          <Stack
            ref={provided.innerRef}
            {...provided.droppableProps}
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{
              bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
              p: 1,
              borderRadius: 1,
              transition: 'background-color 0.2s',
            }}
          >
            {innings.map((inning, index) => (
              <Draggable key={`inning-${index}`} draggableId={`inning-${index}`} index={index}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      opacity: snapshot.isDragging ? 0.8 : 1,
                    }}
                  >
                    <Box
                      {...provided.dragHandleProps}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' },
                        mr: 0.5,
                      }}
                    >
                      <DragIcon fontSize="small" color="action" />
                    </Box>
                    <Chip
                      label={`Inning ${index + 1}`}
                      onClick={() => setCurrentInning(index)}
                      onDelete={innings.length > 1 ? (e) => handleDeleteInning(index, e) : undefined}
                      color={currentInningIndex === index ? 'primary' : 'default'}
                      variant={currentInningIndex === index ? 'filled' : 'outlined'}
                      sx={{ minWidth: 100 }}
                    />
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Stack>
        )}
      </Droppable>

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
    </Paper>
  );
}

export default InningManager;

