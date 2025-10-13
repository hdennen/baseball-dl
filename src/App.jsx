import { useState } from 'react';
import { Container, Box, Typography, Tabs, Tab, ThemeProvider, createTheme, Chip } from '@mui/material';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import PlayerManagement from './components/PlayerManagement';
import BaseballField from './components/BaseballField';
import InningManager from './components/InningManager';
import InningsSummary from './components/InningsSummary';
import FieldConfiguration from './components/FieldConfiguration';
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
  const [activeId, setActiveId] = useState(null);
  const { assignPosition, players } = useBaseballStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over) return;

    // If dropped in the same place, do nothing
    if (active.id === over.id) {
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    // If dropped on a position
    if (overId.startsWith('position-')) {
      const targetPosition = overId.replace('position-', '');
      assignPosition(targetPosition, activeId);
    }
    
    // If dropped back to bench
    if (overId === 'bench') {
      // Find which position this player was in and remove them
      const sourcePosition = active.data.current?.position;
      if (sourcePosition) {
        assignPosition(sourcePosition, null);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
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
              <FieldConfiguration />
              <BaseballField />
            </Box>
          )}

          {currentView === 1 && (
            <InningsSummary />
          )}
        </Container>
        <DragOverlay>
          {activeId ? (
            <Chip
              label={players.find(p => p.id === activeId)?.name || ''}
              color="primary"
              size="small"
              sx={{
                cursor: 'grabbing',
                boxShadow: 3,
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </ThemeProvider>
  );
}

export default App;

