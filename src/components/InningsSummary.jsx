import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
} from '@mui/material';
import useBaseballStore from '../store/useBaseballStore';
import { POSITIONS } from '../store/useBaseballStore';

function InningsSummary() {
  const { innings, players, getBenchedPlayers, getPositionLabel } = useBaseballStore();

  // Get player name by ID
  const getPlayerName = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    return player ? player.name : '-';
  };

  // Create a matrix view: rows are players, columns are innings
  const createPlayerInningMatrix = () => {
    const matrix = {};
    
    players.forEach((player) => {
      matrix[player.id] = {
        name: player.name,
        innings: [],
      };
      
      innings.forEach((inning, inningIndex) => {
        // Find which position this player is in for this inning
        const position = Object.entries(inning.positions).find(
          ([pos, playerId]) => playerId === player.id
        );
        
        matrix[player.id].innings.push(position ? position[0] : 'bench');
      });
    });
    
    return matrix;
  };

  const playerMatrix = createPlayerInningMatrix();

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Complete Lineup Summary
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          View all innings and player positions at a glance
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Player x Inning Matrix */}
        <Typography variant="h6" gutterBottom>
          Player Positions by Inning
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Player</TableCell>
                {innings.map((_, index) => (
                  <TableCell key={index} align="center" sx={{ fontWeight: 'bold' }}>
                    Inning {index + 1}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(playerMatrix).map((playerData) => (
                <TableRow key={playerData.name}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    {playerData.name}
                  </TableCell>
                  {playerData.innings.map((position, inningIndex) => (
                    <TableCell key={inningIndex} align="center">
                      <Chip
                        label={position === 'bench' ? 'Bench' : getPositionLabel(position)}
                        color={position === 'bench' ? 'warning' : 'success'}
                        size="small"
                        variant={position === 'bench' ? 'outlined' : 'filled'}
                        sx={{ minWidth: 80, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ mb: 3 }} />

        {/* Inning by Inning Breakdown */}
        <Typography variant="h6" gutterBottom>
          Inning by Inning Breakdown
        </Typography>
        <Grid container spacing={3}>
          {innings.map((inning, inningIndex) => {
            const benchedPlayers = getBenchedPlayers(inningIndex);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={inningIndex}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Inning {inningIndex + 1}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Positions:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {POSITIONS.map((position) => {
                      const playerId = inning.positions[position];
                      if (!playerId) return null;
                      
                      return (
                        <Box key={position} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {getPositionLabel(position)}:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {getPlayerName(playerId)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                  
                  {benchedPlayers.length > 0 && (
                    <>
                      <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
                        Bench:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {benchedPlayers.map((player) => (
                          <Chip
                            key={player.id}
                            label={player.name}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );
}

export default InningsSummary;

