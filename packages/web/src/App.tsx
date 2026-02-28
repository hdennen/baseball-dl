declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box, Typography, Tabs, Tab, ThemeProvider, createTheme, Chip, Paper, Button, Alert } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import { useStytchUser, useStytch } from '@stytch/react';
import PlayerManagement from './components/PlayerManagement';
import GameContext from './components/GameContext';
import BattingOrder from './components/BattingOrder';
import BaseballField from './components/BaseballField';
import InningManager from './components/InningManager';
import InningsSummary from './components/InningsSummary';
import FieldConfiguration from './components/FieldConfiguration';
import Login from './components/Login';
import Authenticate from './components/Authenticate';
import TeamManagement from './components/team/TeamManagement';
import LineupDrawer from './components/LineupDrawer';
import LineupActions from './components/LineupActions';
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

function BattingOrderTab() {
  const { players, addPlayer, removePlayer, currentTeamId, currentLineupStatus } = useBaseballStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isPublished = currentLineupStatus === 'published';

  return (
    <Box>
      <GameContext />
      {currentTeamId ? (
        <>
          <Paper elevation={2} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Team Active" color="success" size="small" />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Players are managed on the Team tab
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setDrawerOpen(true)}
            >
              Lineups
            </Button>
          </Paper>
          <Paper elevation={2} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <LineupActions />
          </Paper>
          {isPublished && (
            <Alert severity="info" sx={{ mb: 3 }}>
              This lineup has been published and is read-only. Duplicate it to make changes.
            </Alert>
          )}
          <LineupDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
      ) : (
        <PlayerManagement
          players={players}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
        />
      )}
      <BattingOrder />
    </Box>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const { assignPosition, players } = useBaseballStore();
  const { user } = useStytchUser();
  const stytch = useStytch();


  const routeToTabIndex: Record<string, number> = {
    '/': 1,
    '/team': 0,
    '/batting': 1,
    '/lineup': 2,
    '/innings': 3,
  };

  const getCurrentTab = () => {
    return routeToTabIndex[location.pathname] ?? false;
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over) return;

    if (active.id === over.id) {
      return;
    }

    const draggedId = String(active.id);
    const overId = String(over.id);

    if (overId.startsWith('position-')) {
      const targetPosition = overId.replace('position-', '');
      assignPosition(targetPosition, draggedId);
    }
    
    if (overId === 'bench') {
      const sourcePosition = active.data.current?.position as string | undefined;
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {user.emails?.[0]?.email}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => stytch.session.revoke()}
                  >
                    Logout
                  </Button>
                </Box>
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
            onChange={(_: React.SyntheticEvent, newValue: number) => {
              setCurrentView(newValue);
              const routes = ['/team', '/batting', '/lineup', '/innings'];
              navigate(routes[newValue]);
            }}
            centered
            sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Team" />
            <Tab label="Batting Order" />
            <Tab label="Lineup Editor" />
            <Tab label="All Innings Summary" />
          </Tabs>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/authenticate" element={<Authenticate />} />
            <Route path="/" element={<Navigate to="/batting" replace />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/batting" element={
              <BattingOrderTab />
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

