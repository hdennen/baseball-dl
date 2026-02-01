import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box, Typography, Tabs, Tab, ThemeProvider, createTheme, Chip, Paper, Button, CircularProgress } from '@mui/material';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useStytchUser, useStytch } from '@stytch/react';
import PlayerManagement from './components/PlayerManagement';
import BattingOrder from './components/BattingOrder';
import BaseballField from './components/BaseballField';
import InningManager from './components/InningManager';
import InningsSummary from './components/InningsSummary';
import FieldConfiguration from './components/FieldConfiguration';
import Login from './components/Login';
import Authenticate from './components/Authenticate';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [activeId, setActiveId] = useState(null);
  const { assignPosition, players } = useBaseballStore();
  const { user, isInitialized } = useStytchUser();
  const stytch = useStytch();


  // Map routes to tab indices
  const routeToTabIndex = {
    '/': 0,
    '/batting': 0,
    '/lineup': 1,
    '/innings': 2,
  };

  // Get current tab based on route
  const getCurrentTab = () => {
    return routeToTabIndex[location.pathname] ?? 0;
  };

  const [currentView, setCurrentView] = useState(getCurrentTab());

  // Sync tab with route changes
  useEffect(() => {
    setCurrentView(getCurrentTab());
  }, [location.pathname]);

  // Track page views with Google Analytics
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname,
        page_title: document.title,
      });
    }
  }, [location.pathname]);

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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              {user ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => stytch.session.revoke()}
                >
                  Logout
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </Button>
              )}
            </Box>
            <Typography variant="h3" component="h1" gutterBottom align="center">
              Baseball Defensive Lineup Manager
            </Typography>
            <Typography variant="subtitle1" align="center" color="text.secondary">
              Create and manage your team's defensive positions for each inning
            </Typography>
          </Box>

          <Tabs 
            className="no-print"
            value={currentView} 
            onChange={(e, newValue) => {
              setCurrentView(newValue);
              // Navigate to corresponding route
              const routes = ['/batting', '/lineup', '/innings'];
              navigate(routes[newValue]);
            }}
            centered
            sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Batting Order" />
            <Tab label="Lineup Editor" />
            <Tab label="All Innings Summary" />
          </Tabs>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/authenticate" element={<Authenticate />} />
            <Route path="/" element={<Navigate to="/batting" replace />} />
            <Route path="/batting" element={
              <Box>
                <PlayerManagement />
                <BattingOrder />
              </Box>
            } />
            <Route path="/lineup" element={
              <Box>
                <Paper elevation={3} sx={{ overflow: 'hidden' }}>
                  <InningManager />
                  <FieldConfiguration />
                  <BaseballField />
                </Paper>
              </Box>
            } />
            <Route path="/innings" element={<InningsSummary />} />
          </Routes>
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

