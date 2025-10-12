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
  const { innings, players, getBenchedPlayers } = useBaseballStore();

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

  const PositionCard = ({ position }) => (
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
            }}
          >
            {playerName}
          </Box>
        );
      })}
    </Box>
  );

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

        {/* Baseball Diamond Layout */}
        <Box 
          sx={{ 
            position: 'relative', 
            minHeight: 800, 
            mb: 4,
            bgcolor: '#f5f5f5',
            borderRadius: 2,
            p: 2,
            '@media print': {
              mb: 2,
              p: 1,
              pageBreakAfter: 'avoid',
            },
          }}
        >
          {/* Baseball Diamond Background */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 550,
              height: 550,
              transform: 'translate(-50%, -45%) rotate(45deg)',
              border: '4px solid #8b4513',
              borderRadius: 1,
              bgcolor: '#d2b48c',
              opacity: 0.3,
              zIndex: 0,
              '@media print': {
                border: '3px solid #8b4513',
              },
            }}
          />

          {/* Foul lines */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '12%',
              left: '50%',
              width: '50%',
              height: '3px',
              bgcolor: 'white',
              transform: 'rotate(-45deg)',
              transformOrigin: 'left center',
              opacity: 0.4,
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '12%',
              right: '50%',
              width: '50%',
              height: '3px',
              bgcolor: 'white',
              transform: 'rotate(45deg)',
              transformOrigin: 'right center',
              opacity: 0.4,
              zIndex: 0,
            }}
          />

          {/* Outfield Arc */}
          <Box
            sx={{
              position: 'absolute',
              top: '5%',
              left: '50%',
              width: 750,
              height: 375,
              transform: 'translateX(-50%)',
              borderTop: '3px solid rgba(0,0,0,0.15)',
              borderRadius: '375px 375px 0 0',
              zIndex: 0,
            }}
          />

          {/* Position Cards - Absolutely positioned */}
          <Box sx={{ position: 'relative', zIndex: 1, height: 800 }}>
            {/* Outfield */}
            <Box sx={{ position: 'absolute', left: '5%', top: '12%' }}>
              <PositionCard position={positions[0]} /> {/* LF */}
            </Box>
            <Box sx={{ position: 'absolute', left: '23%', top: '6%' }}>
              <PositionCard position={positions[1]} /> {/* LCF */}
            </Box>
            <Box sx={{ position: 'absolute', left: '50%', top: '3%', transform: 'translateX(-50%)' }}>
              <PositionCard position={positions[2]} /> {/* CF */}
            </Box>
            <Box sx={{ position: 'absolute', right: '23%', top: '6%' }}>
              <PositionCard position={positions[3]} /> {/* RCF */}
            </Box>
            <Box sx={{ position: 'absolute', right: '5%', top: '12%' }}>
              <PositionCard position={positions[4]} /> {/* RF */}
            </Box>

            {/* Infield - Left side (3B-SS line) */}
            <Box sx={{ position: 'absolute', left: '12%', top: '50%' }}>
              <PositionCard position={positions[5]} /> {/* 3B */}
            </Box>
            <Box sx={{ position: 'absolute', left: '29%', top: '40%' }}>
              <PositionCard position={positions[6]} /> {/* SS */}
            </Box>

            {/* Infield - Right side (2B-1B line) */}
            <Box sx={{ position: 'absolute', right: '29%', top: '40%' }}>
              <PositionCard position={positions[7]} /> {/* 2B */}
            </Box>
            <Box sx={{ position: 'absolute', right: '12%', top: '50%' }}>
              <PositionCard position={positions[8]} /> {/* 1B */}
            </Box>

            {/* Pitcher - Center */}
            <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translateX(-50%)' }}>
              <PositionCard position={positions[9]} /> {/* P */}
            </Box>

            {/* Catcher - Home */}
            <Box sx={{ position: 'absolute', left: '50%', bottom: '0%', transform: 'translateX(-50%)' }}>
              <PositionCard position={positions[10]} /> {/* C */}
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
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Opponent: ___________________________
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Date: ___________________________
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Result: ___________________________
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default InningsSummary;

