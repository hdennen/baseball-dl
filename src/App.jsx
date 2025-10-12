import { useState } from 'react';
import { Container, Box, Typography, Tabs, Tab, ThemeProvider, createTheme } from '@mui/material';
import { DragDropContext } from 'react-beautiful-dnd';
import PlayerManagement from './components/PlayerManagement';
import BaseballField from './components/BaseballField';
import InningManager from './components/InningManager';
import InningsSummary from './components/InningsSummary';
import useBaseballStore from './store/useBaseballStore';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState(0);
  const { assignPosition, players, reorderInnings } = useBaseballStore();

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // If dropped in the same place, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle inning reordering
    if (destination.droppableId === 'innings' && source.droppableId === 'innings') {
      reorderInnings(source.index, destination.index);
      return;
    }

    // Extract playerId from draggableId
    const playerId = draggableId;

    // If dropped on a position
    if (destination.droppableId.startsWith('position-')) {
      const targetPosition = destination.droppableId.replace('position-', '');
      assignPosition(targetPosition, playerId);
    }
    
    // If dropped back to bench
    if (destination.droppableId === 'bench') {
      // Find which position this player was in and remove them
      if (source.droppableId.startsWith('position-')) {
        const sourcePosition = source.droppableId.replace('position-', '');
        assignPosition(sourcePosition, null);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Container 
          maxWidth="xl" 
          sx={{ 
            py: 4,
            '@media print': {
              '& .no-print': { display: 'none !important' },
              p: 0,
              m: 0,
              maxWidth: '100%',
            },
          }}
        >
          <Box className="no-print" sx={{ mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
              ⚾ Baseball Defensive Lineup Manager
            </Typography>
            <Typography variant="subtitle1" align="center" color="text.secondary">
              Create and manage your team's defensive positions for each inning
            </Typography>
          </Box>

          <Tabs 
            className="no-print"
            value={currentView} 
            onChange={(e, newValue) => setCurrentView(newValue)}
            centered
            sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Lineup Editor" />
            <Tab label="All Innings Summary" />
          </Tabs>

          {currentView === 0 && (
            <Box>
              <PlayerManagement />
              <InningManager />
              <BaseballField />
            </Box>
          )}

          {currentView === 1 && (
            <InningsSummary />
          )}
        </Container>
      </DragDropContext>
    </ThemeProvider>
  );
}

export default App;

