import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import useBaseballStore from '../store/useBaseballStore';
import FieldView from './print-layouts/FieldView';
import BattingOrderView from './print-layouts/BattingOrderView';
import PositionView from './print-layouts/PositionView';
import BoxScoreView from './print-layouts/BoxScoreView';

function InningsSummary() {
  const { innings, players, getBenchedPlayers, getBattingOrderWithPlayers, gameContext } = useBaseballStore();
  const [layoutType, setLayoutType] = useState('field');

  // Get player name by ID
  const getPlayerName = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    return player ? player.name : '';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLayoutChange = (event, newLayout) => {
    if (newLayout !== null) {
      setLayoutType(newLayout);
    }
  };

  const layoutTitles = {
    field: 'Field Positions by Inning',
    batting: 'Batting Order View',
    position: 'Positions by Inning',
    boxscore: 'Box Score Card',
  };

  // Common props passed to all layout components
  const layoutProps = {
    innings,
    players,
    getPlayerName,
    getBenchedPlayers,
    getBattingOrderWithPlayers,
    gameContext,
  };

  return (
    <Box
      sx={{
        '@media print': {
          '& .no-print': { display: 'none' },
          margin: 0,
          padding: 0,
        },
      }}
    >
      <Box className="no-print" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            {layoutTitles[layoutType]}
          </Typography>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print Lineup Card
          </Button>
        </Box>
        <ToggleButtonGroup
          value={layoutType}
          exclusive
          onChange={handleLayoutChange}
          size="small"
        >
          <ToggleButton value="field">Field View</ToggleButton>
          <ToggleButton value="batting">Batting Order</ToggleButton>
          <ToggleButton value="position">By Position</ToggleButton>
          <ToggleButton value="boxscore">Box Score</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {layoutType === 'field' && <FieldView {...layoutProps} />}
      {layoutType === 'batting' && <BattingOrderView {...layoutProps} />}
      {layoutType === 'position' && <PositionView {...layoutProps} />}
      {layoutType === 'boxscore' && <BoxScoreView {...layoutProps} />}
    </Box>
  );
}

export default InningsSummary;
