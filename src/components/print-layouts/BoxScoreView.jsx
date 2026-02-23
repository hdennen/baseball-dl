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
  TextField,
} from '@mui/material';

// Position key to abbreviation mapping
const positionLabels = {
  'pitcher': 'P',
  'catcher': 'C',
  'first-base': '1B',
  'second-base': '2B',
  'third-base': '3B',
  'shortstop': 'SS',
  'left-field': 'LF',
  'center-left-field': 'LCF',
  'center-field': 'CF',
  'center-right-field': 'RCF',
  'right-field': 'RF',
};

function BoxScoreView({ innings, getBattingOrderWithPlayers, getBenchedPlayers }) {
  const battingOrder = getBattingOrderWithPlayers();

  // Find position for a player in a specific inning
  const getPlayerPositionInInning = (playerId, inningIndex) => {
    const inning = innings[inningIndex];
    if (!inning) return null;

    for (const [positionKey, assignedPlayerId] of Object.entries(inning.positions)) {
      if (assignedPlayerId === playerId) {
        return positionLabels[positionKey] || positionKey;
      }
    }
    return null;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        maxWidth: 900,
        mx: 'auto',
        '@media print': {
          boxShadow: 'none',
          p: 0,
          m: 0,
          maxWidth: '100%',
          fontSize: '0.7rem',
          '& .MuiTypography-h5': { fontSize: '1rem' },
          '& .MuiTypography-subtitle1': { fontSize: '0.8rem' },
          '& .MuiTypography-body2': { fontSize: '0.65rem' },
          '& .MuiTypography-caption': { fontSize: '0.6rem' },
          '& .MuiTableCell-root': {
            padding: '2px 4px',
            fontSize: '0.65rem',
          },
        },
      }}
    >
      {/* Card Header with editable fields */}
      <Box
        sx={{
          border: '2px solid black',
          borderBottom: 'none',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'grey.100',
          '@media print': { p: 1 },
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          OFFICIAL LINEUP CARD
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Date:</Typography>
            <Box
              sx={{
                borderBottom: '1px solid black',
                minWidth: 100,
                height: 20,
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>vs:</Typography>
            <Box
              sx={{
                borderBottom: '1px solid black',
                minWidth: 120,
                height: 20,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Main Lineup Table */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 0,
          '& .MuiPaper-root': { borderRadius: 0 },
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.200' }}>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  border: '2px solid black',
                  width: 40,
                  textAlign: 'center',
                }}
              >
                #
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  border: '2px solid black',
                  minWidth: 140,
                }}
              >
                PLAYER
              </TableCell>
              <TableCell
                colSpan={innings.length}
                align="center"
                sx={{
                  fontWeight: 'bold',
                  border: '2px solid black',
                  bgcolor: 'grey.300',
                }}
              >
                DEFENSIVE POSITIONS BY INNING
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ border: '1px solid black' }} />
              <TableCell sx={{ border: '1px solid black' }} />
              {innings.map((_, idx) => (
                <TableCell
                  key={idx}
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    border: '1px solid black',
                    minWidth: 40,
                  }}
                >
                  {idx + 1}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {battingOrder.map((item) => (
              <TableRow key={item.playerId}>
                <TableCell
                  sx={{
                    border: '1px solid black',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                  }}
                >
                  {item.order}
                </TableCell>
                <TableCell
                  sx={{
                    border: '1px solid black',
                    fontWeight: 'bold',
                  }}
                >
                  {item.player.name}
                </TableCell>
                {innings.map((_, inningIdx) => {
                  const position = getPlayerPositionInInning(item.playerId, inningIdx);
                  const isBenched = position === null;
                  return (
                    <TableCell
                      key={inningIdx}
                      align="center"
                      sx={{
                        border: '1px solid black',
                        bgcolor: isBenched ? 'grey.200' : 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                      }}
                    >
                      {position || '—'}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {battingOrder.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2 + innings.length}
                  sx={{
                    border: '1px solid black',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    py: 3,
                  }}
                >
                  No batting order set
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Box Score Section */}
      <Box
        sx={{
          border: '2px solid black',
          borderTop: 'none',
          p: 2,
          '@media print': { pageBreakInside: 'avoid', p: 1 },
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
          BOX SCORE
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <TableContainer sx={{ maxWidth: 500 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black', width: 70 }}>
                    TEAM
                  </TableCell>
                  {innings.map((_, idx) => (
                    <TableCell
                      key={idx}
                      align="center"
                      sx={{ fontWeight: 'bold', border: '1px solid black', width: 35 }}
                    >
                      {idx + 1}
                    </TableCell>
                  ))}
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 'bold', border: '1px solid black', width: 45, bgcolor: 'grey.100' }}
                  >
                    R
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 'bold', border: '1px solid black', width: 45, bgcolor: 'grey.100' }}
                  >
                    H
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 'bold', border: '1px solid black', width: 45, bgcolor: 'grey.100' }}
                  >
                    E
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>AWAY</TableCell>
                  {innings.map((_, idx) => (
                    <TableCell key={idx} sx={{ border: '1px solid black', height: 32 }} />
                  ))}
                  <TableCell sx={{ border: '1px solid black', bgcolor: 'grey.50' }} />
                  <TableCell sx={{ border: '1px solid black', bgcolor: 'grey.50' }} />
                  <TableCell sx={{ border: '1px solid black', bgcolor: 'grey.50' }} />
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>HOME</TableCell>
                  {innings.map((_, idx) => (
                    <TableCell key={idx} sx={{ border: '1px solid black', height: 32 }} />
                  ))}
                  <TableCell sx={{ border: '1px solid black', bgcolor: 'grey.50' }} />
                  <TableCell sx={{ border: '1px solid black', bgcolor: 'grey.50' }} />
                  <TableCell sx={{ border: '1px solid black', bgcolor: 'grey.50' }} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* Bench Summary */}
      <Box
        sx={{
          border: '2px solid black',
          borderTop: 'none',
          p: 2,
          '@media print': { pageBreakInside: 'avoid', p: 1 },
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, '@media print': { mb: 0.5 } }}>
          BENCH BY INNING
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, '@media print': { gap: 0.5 } }}>
          {innings.map((_, inningIdx) => {
            const benched = getBenchedPlayers(inningIdx);
            return (
              <Box
                key={inningIdx}
                sx={{
                  border: '1px solid black',
                  p: 1,
                  minWidth: 100,
                  bgcolor: 'grey.50',
                  '@media print': { p: 0.5, minWidth: 70 },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                  {inningIdx + 1}:
                </Typography>
                <Typography variant="body2">
                  {benched.length > 0
                    ? benched.map((p) => p.name).join(', ')
                    : '—'}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Notes Section */}
      <Box
        sx={{
          border: '2px solid black',
          borderTop: 'none',
          p: 2,
          '@media print': {
            p: 1,
          },
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, '@media print': { mb: 0.5 } }}>
          NOTES
        </Typography>
        <Box
          sx={{
            borderBottom: '1px solid grey',
            height: 24,
            mb: 1,
            '@media print': { height: 16, mb: 0.5 },
          }}
        />
        <Box
          sx={{
            borderBottom: '1px solid grey',
            height: 24,
            mb: 1,
            '@media print': { height: 16, mb: 0.5 },
          }}
        />
        <Box
          sx={{
            borderBottom: '1px solid grey',
            height: 24,
            '@media print': { height: 16 },
          }}
        />
      </Box>

      {/* Footer */}
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'text.secondary',
        }}
      >
        <Typography variant="caption">
          P=Pitcher C=Catcher 1B/2B/3B=Bases SS=Short LF/CF/RF=Outfield
        </Typography>
        <Typography variant="caption">
          LineupManager.app
        </Typography>
      </Box>
    </Paper>
  );
}

export default BoxScoreView;
