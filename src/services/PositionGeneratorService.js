/**
 * Service for generating baseball position assignments
 */

const POSITIONS = [
  'pitcher',
  'catcher',
  'first-base',
  'second-base',
  'shortstop',
  'third-base',
  'left-field',
  'center-left-field',
  'center-field',
  'center-right-field',
  'right-field',
];

const DEFAULT_FIELD_CONFIG = {
  'center-field': true,
  'center-left-field': false,
  'center-right-field': false,
};

/**
 * Get active positions based on field configuration
 * @param {Object} fieldConfig - The field configuration object
 * @returns {Array} Array of active position names
 */
export const getActivePositions = (fieldConfig = DEFAULT_FIELD_CONFIG) => {
  return POSITIONS.filter((position) => {
    // Only filter the configurable positions
    if (position === 'center-field' || position === 'center-left-field' || position === 'center-right-field') {
      return fieldConfig[position] === true;
    }
    return true; // All other positions are always active
  });
};

/**
 * Shuffle an array of players randomly
 * @param {Array} players - Array of player objects
 * @returns {Array} Shuffled array of players
 */
export const shufflePlayers = (players) => {
  return [...players].sort(() => Math.random() - 0.5);
};

/**
 * Generate position assignments for a single inning
 * @param {Array} players - Array of player objects
 * @param {Object} fieldConfig - Field configuration object
 * @returns {Object} Object containing positions and fieldConfig
 */
export const generateInningPositions = (players, fieldConfig = DEFAULT_FIELD_CONFIG) => {
  if (players.length === 0) {
    return {
      positions: {},
      fieldConfig: { ...fieldConfig }
    };
  }

  const shuffledPlayers = shufflePlayers(players);
  const activePositions = getActivePositions(fieldConfig);
  const positions = {};

  // Assign players to active positions
  activePositions.forEach((position, index) => {
    if (index < shuffledPlayers.length) {
      positions[position] = shuffledPlayers[index].id;
    }
  });

  return {
    positions,
    fieldConfig: { ...fieldConfig }
  };
};

/**
 * Generate position assignments for multiple innings
 * @param {Array} players - Array of player objects
 * @param {number} inningCount - Number of innings to generate
 * @param {Object} fieldConfig - Field configuration object
 * @returns {Array} Array of inning objects with positions and fieldConfig
 */
export const generatePositionsForAllInnings = (players, inningCount, fieldConfig = DEFAULT_FIELD_CONFIG) => {
  if (players.length === 0) {
    throw new Error('No players available to assign positions');
  }

  const newInnings = [];

  for (let i = 0; i < inningCount; i++) {
    // Generate positions for this inning (each inning gets different random assignments)
    const inning = generateInningPositions(players, fieldConfig);
    newInnings.push(inning);
  }

  return newInnings;
};

/**
 * Generate positions for the current inning only
 * @param {Array} players - Array of player objects
 * @param {Object} fieldConfig - Field configuration object
 * @returns {Object} Object containing positions and fieldConfig
 */
export const generateCurrentInningPositions = (players, fieldConfig = DEFAULT_FIELD_CONFIG) => {
  return generateInningPositions(players, fieldConfig);
};

export { POSITIONS, DEFAULT_FIELD_CONFIG };
