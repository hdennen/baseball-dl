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
import GameContextHeader from './GameContextHeader';
import type { Inning, Player, BattingOrderEntry } from '../../types';
import type { WebGameContext } from '../../types';

const positionLabels: Record<string, string> = {
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

interface BattingOrderViewProps {
  innings: Inning[];
  getBattingOrderWithPlayers: () => BattingOrderEntry[];
  getBenchedPlayers: (inningIndex: number) => Player[];
  gameContext: WebGameContext;
}

function BattingOrderView({ innings, getBattingOrderWithPlayers, gameContext }: BattingOrderViewProps) {
  const battingOrder = getBattingOrderWithPlayers();

  const getPlayerPositionInInning = (playerId: string, inningIndex: number): string | null => {
    const inning = innings[inningIndex];
    if (!inning) return null;

    for (const [positionKey, assignedPlayerId] of Object.entries(inning.positions)) {
      if (assignedPlayerId === playerId) {
        return positionLabels[positionKey] || positionKey;
      }
    }
    return null; // Player is benched this inning
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
          fontSize: '0.75rem',
          '& .MuiTypography-h5': { fontSize: '1rem' },
          '& .MuiTypography-body2': { fontSize: '0.7rem' },
          '& .MuiTypography-subtitle2': { fontSize: '0.75rem' },
          '& .MuiTableCell-root': {
            padding: '2px 4px',
            fontSize: '0.7rem',
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center', '@media print': { mb: 1 } }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, '@media print': { mb: 0.5 } }}>
          LINEUP CARD - BATTING ORDER VIEW
        </Typography>
        <GameContextHeader gameContext={gameContext} />
        <Typography variant="body2" color="text.secondary" sx={{ '@media print': { display: 'none' } }}>
          Each row shows a player's defensive position by inning
        </Typography>
      </Box>

      {/* Main Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, '@media print': { mb: 1 } }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  border: '1px solid black',
                  width: 40,
                  textAlign: 'center',
                }}
              >
                #
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  border: '1px solid black',
                  minWidth: 120,
                }}
              >
                Player
              </TableCell>
              {innings.map((_, idx) => (
                <TableCell
                  key={idx}
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    border: '1px solid black',
                    minWidth: 45,
                    bgcolor: 'grey.100',
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
                    bgcolor: 'grey.50',
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
                  {item.player!.name}
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
                        color: isBenched ? 'text.secondary' : 'text.primary',
                        fontWeight: isBenched ? 'normal' : 'medium',
                        fontStyle: isBenched ? 'italic' : 'normal',
                      }}
                    >
                      {position || 'BN'}
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

      {/* Position Legend */}
      <Box sx={{ mb: 3, '@media print': { mb: 1 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, '@media print': { display: 'none' } }}>
          POSITION KEY
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, fontSize: '0.75rem', '@media print': { gap: 1, fontSize: '0.55rem' } }}>
          <span><strong>P</strong>=Pitcher</span>
          <span><strong>C</strong>=Catcher</span>
          <span><strong>1B</strong>=First</span>
          <span><strong>2B</strong>=Second</span>
          <span><strong>SS</strong>=Short</span>
          <span><strong>3B</strong>=Third</span>
          <span><strong>LF</strong>=Left</span>
          <span><strong>CF</strong>=Center</span>
          <span><strong>RF</strong>=Right</span>
          <span><strong>BN</strong>=Bench</span>
        </Box>
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

export default BattingOrderView;
