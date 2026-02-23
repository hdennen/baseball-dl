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
} from '@mui/material';

// Positions in fielding order (battery, infield, outfield)
const positions = [
  { key: 'pitcher', label: 'P', fullName: 'Pitcher' },
  { key: 'catcher', label: 'C', fullName: 'Catcher' },
  { key: 'first-base', label: '1B', fullName: 'First Base' },
  { key: 'second-base', label: '2B', fullName: 'Second Base' },
  { key: 'shortstop', label: 'SS', fullName: 'Shortstop' },
  { key: 'third-base', label: '3B', fullName: 'Third Base' },
  { key: 'left-field', label: 'LF', fullName: 'Left Field' },
  { key: 'center-left-field', label: 'LCF', fullName: 'Left Center' },
  { key: 'center-field', label: 'CF', fullName: 'Center Field' },
  { key: 'center-right-field', label: 'RCF', fullName: 'Right Center' },
  { key: 'right-field', label: 'RF', fullName: 'Right Field' },
];

function PositionView({ innings, getPlayerName, getBenchedPlayers }) {
  // Check if a position is used in any inning
  const isPositionUsedInAnyInning = (positionKey) => {
    if (positionKey !== 'center-field' && positionKey !== 'center-left-field' && positionKey !== 'center-right-field') {
      return true;
    }
    return innings.some((inning) => {
      const fieldConfig = inning.fieldConfig || {};
      return fieldConfig[positionKey] === true;
    });
  };

  // Check if position is active in specific inning
  const isPositionActiveInInning = (inning, positionKey) => {
    if (positionKey !== 'center-field' && positionKey !== 'center-left-field' && positionKey !== 'center-right-field') {
      return true;
    }
    const fieldConfig = inning.fieldConfig || {};
    return fieldConfig[positionKey] === true;
  };

  const visiblePositions = positions.filter((pos) => isPositionUsedInAnyInning(pos.key));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        maxWidth: 1000,
        mx: 'auto',
        '@media print': {
          boxShadow: 'none',
          p: 0,
          m: 0,
          maxWidth: '100%',
          fontSize: '0.7rem',
          '& .MuiTypography-h5': { fontSize: '1rem' },
          '& .MuiTypography-body2': { fontSize: '0.65rem' },
          '& .MuiTypography-subtitle2': { fontSize: '0.75rem' },
          '& .MuiTableCell-root': {
            padding: '2px 4px',
            fontSize: '0.65rem',
            minWidth: 'auto !important',
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center', '@media print': { mb: 1 } }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, '@media print': { mb: 0 } }}>
          LINEUP CARD - BY POSITION
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ '@media print': { display: 'none' } }}>
          Quick reference: Who plays each position by inning
        </Typography>
      </Box>

      {/* Main Table - Positions as rows, Innings as columns */}
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, '@media print': { mb: 1 } }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  border: '1px solid black',
                  width: 100,
                }}
              >
                Position
              </TableCell>
              {innings.map((_, idx) => (
                <TableCell
                  key={idx}
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    border: '1px solid black',
                    minWidth: 80,
                    bgcolor: 'grey.100',
                  }}
                >
                  <Box component="span" sx={{ '@media print': { display: 'none' } }}>Inning </Box>{idx + 1}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visiblePositions.map((position, posIdx) => {
              // Add visual separator between sections
              const isFirstInfield = position.key === 'first-base';
              const isFirstOutfield = position.key === 'left-field';

              return (
                <TableRow key={position.key}>
                  <TableCell
                    sx={{
                      border: '1px solid black',
                      fontWeight: 'bold',
                      bgcolor: 'grey.50',
                      borderTop: (isFirstInfield || isFirstOutfield) ? '2px solid black' : '1px solid black',
                    }}
                  >
                    {position.label} - {position.fullName}
                  </TableCell>
                  {innings.map((inning, inningIdx) => {
                    const isActive = isPositionActiveInInning(inning, position.key);
                    const playerId = inning.positions[position.key];
                    const playerName = playerId ? getPlayerName(playerId) : '';

                    return (
                      <TableCell
                        key={inningIdx}
                        align="center"
                        sx={{
                          border: '1px solid black',
                          bgcolor: !isActive ? 'grey.200' : (playerName ? 'white' : 'warning.light'),
                          fontStyle: !isActive ? 'italic' : 'normal',
                          color: !isActive ? 'text.secondary' : 'text.primary',
                          borderTop: (isFirstInfield || isFirstOutfield) ? '2px solid black' : '1px solid black',
                        }}
                      >
                        {isActive ? (playerName || '—') : 'N/A'}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bench Section */}
      <Box sx={{ mb: 3, '@media print': { pageBreakInside: 'avoid', mb: 1 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, '@media print': { mb: 0.5 } }}>
          BENCH BY INNING
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                {innings.map((_, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{
                      fontWeight: 'bold',
                      border: '1px solid black',
                      minWidth: 80,
                    }}
                  >
                    <Box component="span" sx={{ '@media print': { display: 'none' } }}>Inning </Box>{idx + 1}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {innings.map((_, inningIdx) => {
                  const benched = getBenchedPlayers(inningIdx);
                  return (
                    <TableCell
                      key={inningIdx}
                      sx={{
                        border: '1px solid black',
                        verticalAlign: 'top',
                        minHeight: 60,
                        '@media print': { minHeight: 'auto' },
                      }}
                    >
                      {benched.length > 0 ? (
                        benched.map((player) => (
                          <Box key={player.id} sx={{ fontSize: '0.875rem', mb: 0.5, '@media print': { fontSize: '0.6rem', mb: 0 } }}>
                            {player.name}
                          </Box>
                        ))
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Box Score */}
      <Box sx={{ '@media print': { pageBreakInside: 'avoid' } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          BOX SCORE
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid black', width: 60 }}>
                  Team
                </TableCell>
                {innings.map((_, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{ fontWeight: 'bold', border: '1px solid black', minWidth: 30 }}
                  >
                    {idx + 1}
                  </TableCell>
                ))}
                <TableCell
                  align="center"
                  sx={{ fontWeight: 'bold', border: '1px solid black', minWidth: 40 }}
                >
                  R
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Away</TableCell>
                {innings.map((_, idx) => (
                  <TableCell key={idx} sx={{ border: '1px solid black', height: 28 }} />
                ))}
                <TableCell sx={{ border: '1px solid black' }} />
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Home</TableCell>
                {innings.map((_, idx) => (
                  <TableCell key={idx} sx={{ border: '1px solid black', height: 28 }} />
                ))}
                <TableCell sx={{ border: '1px solid black' }} />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
}

export default PositionView;
