import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
} from '@mui/material';
import useBaseballStore from '../store/useBaseballStore';

// Visual Baseball Diamond Component
function BaseballDiamond({ inning, inningIndex, getBenchedPlayers, getPlayerName }) {
  const benchedPlayers = getBenchedPlayers(inningIndex);
  
  const getPlayer = (position) => {
    const playerId = inning.positions[position];
    return playerId ? getPlayerName(playerId) : '';
  };

  const PlayerBadge = ({ name, abbreviation }) => (
    <Box
      sx={{
        bgcolor: name ? 'success.main' : 'grey.300',
        color: name ? 'white' : 'grey.600',
        borderRadius: 1,
        px: 1,
        py: 0.5,
        fontSize: '0.75rem',
        fontWeight: 'bold',
        textAlign: 'center',
        minWidth: 40,
        boxShadow: name ? 1 : 0,
      }}
    >
      {name || abbreviation}
    </Box>
  );

  return (
    <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom color="primary" align="center">
        Inning {inningIndex + 1}
      </Typography>
      
      {/* Baseball Field Layout */}
      <Box sx={{ position: 'relative', minHeight: 500, mb: 2 }}>
        {/* Outfield */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 0.5 }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>LF</Typography>
            <PlayerBadge name={getPlayer('left-field')} abbreviation="LF" />
          </Box>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>LCF</Typography>
            <PlayerBadge name={getPlayer('center-left-field')} abbreviation="LCF" />
          </Box>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>CF</Typography>
            <PlayerBadge name={getPlayer('center-field')} abbreviation="CF" />
          </Box>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>RCF</Typography>
            <PlayerBadge name={getPlayer('center-right-field')} abbreviation="RCF" />
          </Box>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>RF</Typography>
            <PlayerBadge name={getPlayer('right-field')} abbreviation="RF" />
          </Box>
        </Box>

        {/* Diamond Shape for Infield */}
        <Box 
          sx={{ 
            position: 'relative',
            width: 280,
            height: 280,
            margin: '0 auto',
            mb: 3,
          }}
        >
          {/* Diamond Background */}
          <Box
            sx={{
              position: 'absolute',
              width: 200,
              height: 200,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(45deg)',
              border: '3px solid',
              borderColor: 'success.main',
              bgcolor: 'success.50',
              opacity: 0.2,
            }}
          />

          {/* Third Base - Left */}
          <Box sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>3B</Typography>
            <PlayerBadge name={getPlayer('third-base')} abbreviation="3B" />
          </Box>

          {/* Shortstop - Left-Center */}
          <Box sx={{ position: 'absolute', left: '25%', top: '25%', transform: 'translate(-50%, -50%)' }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>SS</Typography>
            <PlayerBadge name={getPlayer('shortstop')} abbreviation="SS" />
          </Box>

          {/* Second Base - Top Center */}
          <Box sx={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)' }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>2B</Typography>
            <PlayerBadge name={getPlayer('second-base')} abbreviation="2B" />
          </Box>

          {/* First Base - Right */}
          <Box sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>1B</Typography>
            <PlayerBadge name={getPlayer('first-base')} abbreviation="1B" />
          </Box>

          {/* Pitcher - Center */}
          <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>P</Typography>
            <PlayerBadge name={getPlayer('pitcher')} abbreviation="P" />
          </Box>

          {/* Catcher - Bottom */}
          <Box sx={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)' }}>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>C</Typography>
            <PlayerBadge name={getPlayer('catcher')} abbreviation="C" />
          </Box>
        </Box>

        {/* Bench */}
        {benchedPlayers.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '2px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="warning.main" gutterBottom align="center">
              Bench
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
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
          </Box>
        )}
      </Box>
    </Paper>
  );
}

function InningsSummary() {
  const { innings, players, getBenchedPlayers } = useBaseballStore();

  // Get player name by ID
  const getPlayerName = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    return player ? player.name : '';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Complete Lineup Summary
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Visual overview of all innings with field positions
      </Typography>

      <Grid container spacing={3}>
        {innings.map((inning, inningIndex) => (
          <Grid item xs={12} md={6} lg={4} key={inningIndex}>
            <BaseballDiamond
              inning={inning}
              inningIndex={inningIndex}
              getBenchedPlayers={getBenchedPlayers}
              getPlayerName={getPlayerName}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default InningsSummary;

