import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import useBaseballStore from '../store/useBaseballStore';

function InningsSummary() {
  const { innings, players, getBenchedPlayers, getBattingOrderWithPlayers } = useBaseballStore();

  // Get player name by ID
  const getPlayerName = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    return player ? player.name : '';
  };

  const handlePrint = () => {
    window.print();
  };

  // Position configurations for the lineup card
  const positions = [
    { key: 'left-field', label: 'LF', section: 'outfield' },
    { key: 'center-left-field', label: 'LCF', section: 'outfield' },
    { key: 'center-field', label: 'CF', section: 'outfield' },
    { key: 'center-right-field', label: 'RCF', section: 'outfield' },
    { key: 'right-field', label: 'RF', section: 'outfield' },
    { key: 'third-base', label: '3B', section: 'infield' },
    { key: 'shortstop', label: 'SS', section: 'infield' },
    { key: 'second-base', label: '2B', section: 'infield' },
    { key: 'first-base', label: '1B', section: 'infield' },
    { key: 'pitcher', label: 'P', section: 'battery' },
    { key: 'catcher', label: 'C', section: 'battery' },
  ];

  // Check if a position is active in ANY inning (for display purposes)
  const isPositionUsedInAnyInning = (positionKey) => {
    // Always show non-configurable positions
    if (positionKey !== 'center-field' && positionKey !== 'center-left-field' && positionKey !== 'center-right-field') {
      return true;
    }
    // Check if this position is enabled in any inning
    return innings.some((inning) => {
      const fieldConfig = inning.fieldConfig || {};
      return fieldConfig[positionKey] === true;
    });
  };

  // Filter positions to only show those that are used in at least one inning
  const visiblePositions = positions.filter((pos) => isPositionUsedInAnyInning(pos.key));

  const PositionCard = ({ position }) => {
    // Check if this position is active in each inning
    const isPositionActiveInInning = (inning, positionKey) => {
      // Always show non-configurable positions
      if (positionKey !== 'center-field' && positionKey !== 'center-left-field' && positionKey !== 'center-right-field') {
        return true;
      }
      const fieldConfig = inning.fieldConfig || {};
      return fieldConfig[positionKey] === true;
    };

    return (
      <Box
        sx={{
          border: '2px solid black',
          borderRadius: 1,
          minWidth: 75,
          bgcolor: 'white',
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            borderBottom: '2px solid black',
            py: 0.25,
            bgcolor: 'grey.200',
            fontWeight: 'bold',
            fontSize: '0.75rem',
          }}
        >
          {position.label}
        </Box>
        {innings.map((inning, idx) => {
          const isActive = isPositionActiveInInning(inning, position.key);
          const playerId = inning.positions[position.key];
          const playerName = playerId ? getPlayerName(playerId) : '';
          
          return (
            <Box
              key={idx}
              sx={{
                borderTop: idx > 0 ? '1px solid black' : 'none',
                px: 0.5,
                py: 0.25,
                minHeight: 24,
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.7rem',
                gap: 0.5,
                bgcolor: isActive ? 'white' : 'grey.200',
                fontStyle: isActive ? 'normal' : 'italic',
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  minWidth: '1em',
                }}
              >
                {idx + 1}.
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: '0.7rem',
                }}
              >
                {isActive ? playerName : '—'}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box 
      sx={{ 
        '@media print': { 
          '& .no-print': { display: 'none' },
          margin: 0,
          padding: 0,
        } 
      }}
    >
      <Box className="no-print" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Field Positions by Inning
        </Typography>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Lineup Card
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 1200,
          mx: 'auto',
          '@media print': {
            boxShadow: 'none',
            p: 0,
            m: 0,
            maxWidth: '100%',
          },
        }}
      >
        {/* Top Row: Batting Order and Box Score */}
        <Box 
          sx={{ 
            display: 'flex',
            gap: 3,
            mb: 3,
            '@media print': {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              mb: 0,
            },
          }}
        >
          {/* Batting Order */}
          <Box 
            sx={{ 
              width: 'fit-content',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
              BATTING ORDER
            </Typography>
            <Box
              sx={{
                border: '2px solid black',
                borderRadius: 1,
                bgcolor: 'white',
                '@media print': {
                  border: '1px solid black',
                },
              }}
            >
              {getBattingOrderWithPlayers().map((item, index) => (
                <Box
                  key={item.playerId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: index < getBattingOrderWithPlayers().length - 1 ? '1px solid black' : 'none',
                    px: 1,
                    py: 0.5,
                    minHeight: 28,
                    '@media print': {
                      borderBottom: index < getBattingOrderWithPlayers().length - 1 ? '1px solid black' : 'none',
                      minHeight: 24,
                      px: 0.5,
                      py: 0.25,
                    },
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: 'black',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      mr: 1,
                      '@media print': {
                        minWidth: 20,
                        height: 20,
                        fontSize: '0.7rem',
                        mr: 0.5,
                      },
                    }}
                  >
                    {item.order}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      '@media print': {
                        fontSize: '0.75rem',
                      },
                    }}
                  >
                    {item.player.name}
                  </Typography>
                </Box>
              ))}
              {getBattingOrderWithPlayers().length === 0 && (
                <Box
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    '@media print': {
                      p: 1,
                      fontSize: '0.75rem',
                    },
                  }}
                >
                  No batting order set
                </Box>
              )}
            </Box>
          </Box>

          {/* Box Score Grid */}
          <Box 
            sx={{ 
              flex: 1,
              maxWidth: '400px',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
              BOX SCORE
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', border: '1px solid black', width: '60px' }}>
                      Team
                    </TableCell>
                    {innings.map((_, idx) => (
                      <TableCell key={idx} align="center" sx={{ fontWeight: 'bold', border: '1px solid black', minWidth: '30px' }}>
                        {idx + 1}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>
                      Away
                    </TableCell>
                    {innings.map((_, idx) => (
                      <TableCell key={idx} sx={{ border: '1px solid black', minHeight: '32px' }}>
                        {/* Empty cell for manual scoring */}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>
                      Home
                    </TableCell>
                    {innings.map((_, idx) => (
                      <TableCell key={idx} sx={{ border: '1px solid black', minHeight: '32px' }}>
                        {/* Empty cell for manual scoring */}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>

        {/* Baseball Diamond Layout */}
        <Box 
          sx={{ 
            position: 'relative', 
            minHeight: 800, 
            mb: 4,
            borderRadius: 2,
            p: 2,
            '@media print': {
              width: '1000px',
              transformOrigin: 'top center',
              p: 0,
              pageBreakAfter: 'avoid',
              marginTop: '120px', // Add space for batting order
            },
          }}
        >
          {/* Baseball Diamond Background */}
          <Box
            sx={{
              position: 'absolute',
              top: '59%',
              left: '50%',
              width: 320,
              height: 320,
              transform: 'translate(-50%, -40%) rotate(45deg)',
              borderTop: '2px solid black',
              borderLeft: '2px solid black',
              zIndex: 0,
              '@media print': {
                borderTop: '1px solid black',
                borderLeft: '1px solid black',
              },
            }}
          />

          {/* Foul lines */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '10%',
              left: '50%',
              width: '60%',
              height: '2px',
              bgcolor: 'black',
              transform: 'rotate(-45deg)',
              transformOrigin: 'left center',
              zIndex: 0,
              '@media print': {
                borderBottom: '1px solid black',
                borderLeft: '1px solid black',
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '10%',
              right: '50%',
              width: '60%',
              height: '2px',
              bgcolor: 'black',
              transform: 'rotate(45deg)',
              transformOrigin: 'right center',
              zIndex: 0,
              '@media print': {
                borderBottom: '1px solid black',
                borderRight: '1px solid black',
              },
            }}
          />

          {/* Outfield Arc */}
          <Box
            sx={{
              position: 'absolute',
              top: '24%',
              left: '50%',
              width: 600,
              height: 300,
              transform: 'translateX(-50%)',
              borderTop: '2px solid black',
              borderRadius: '300px 300px 0 0',
              zIndex: 0,
              '@media print': {
                borderTop: '1px solid black',
              },
            }}
          />

          {/* Position Cards - Absolutely positioned */}
          <Box sx={{ position: 'relative', zIndex: 1, height: 800 }}>
            {/* Outfield */}
            <Box sx={{ position: 'absolute', left: '18%', top: '20%' }}>
              <PositionCard position={visiblePositions.find(p => p.key === 'left-field')} />
            </Box>
            {visiblePositions.find(p => p.key === 'center-left-field') && (
              <Box sx={{ position: 'absolute', left: '30%', top: '6%' }}>
                <PositionCard position={visiblePositions.find(p => p.key === 'center-left-field')} />
              </Box>
            )}
            {visiblePositions.find(p => p.key === 'center-field') && (
              <Box sx={{ position: 'absolute', left: '50%', top: '3%', transform: 'translateX(-50%)' }}>
                <PositionCard position={visiblePositions.find(p => p.key === 'center-field')} />
              </Box>
            )}
            {visiblePositions.find(p => p.key === 'center-right-field') && (
              <Box sx={{ position: 'absolute', right: '30%', top: '6%' }}>
                <PositionCard position={visiblePositions.find(p => p.key === 'center-right-field')} />
              </Box>
            )}
            <Box sx={{ position: 'absolute', right: '18%', top: '20%' }}>
              <PositionCard position={visiblePositions.find(p => p.key === 'right-field')} />
            </Box>

            {/* Infield - Left side (3B-SS line) */}
            <Box sx={{ position: 'absolute', left: '28%', top: '50%' }}>
              <PositionCard position={visiblePositions.find(p => p.key === 'third-base')} />
            </Box>
            <Box sx={{ position: 'absolute', left: '39%', top: '28%' }}>
              <PositionCard position={visiblePositions.find(p => p.key === 'shortstop')} />
            </Box>

            {/* Infield - Right side (2B-1B line) */}
            <Box sx={{ position: 'absolute', right: '39%', top: '28%' }}>
              <PositionCard position={visiblePositions.find(p => p.key === 'second-base')} />
            </Box>
            <Box sx={{ position: 'absolute', right: '28%', top: '50%' }}>
              <PositionCard position={visiblePositions.find(p => p.key === 'first-base')} />
            </Box>

            {/* Pitcher - Center */}
            <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translateX(-50%)' }}>
              <PositionCard position={visiblePositions.find(p => p.key === 'pitcher')} />
            </Box>

            {/* Catcher - Home */}
            <Box sx={{ position: 'absolute', left: '50%', bottom: '0%', transform: 'translateX(-50%)' }}>
              <PositionCard position={visiblePositions.find(p => p.key === 'catcher')} />
            </Box>
          </Box>
        </Box>

        {/* Bench */}
        <Box 
          sx={{ 
            mb: 3,
            '@media print': {
              mb: 2,
              pageBreakInside: 'avoid',
            },
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            BENCH
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {innings.map((_, idx) => (
                    <TableCell key={idx} align="center" sx={{ fontWeight: 'bold', border: '1px solid black' }}>
                      {idx + 1}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {innings.map((_, idx) => {
                    const benched = getBenchedPlayers(idx);
                    return (
                      <TableCell key={idx} sx={{ border: '1px solid black', verticalAlign: 'top', minWidth: 100 }}>
                        {benched.map((player) => (
                          <Box key={player.id} sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                            {player.name}
                          </Box>
                        ))}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Result Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 4, 
            mt: 4,
            '@media print': {
              mt: 2,
              pageBreakInside: 'avoid',
            },
          }}
        >
        </Box>
      </Paper>
    </Box>
  );
}

export default InningsSummary;

