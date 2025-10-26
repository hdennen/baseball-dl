/**
 * Service for generating baseball position assignments
 */

import type { Position, FieldConfig, Player, PositionAssignment } from '../types/index.js';

const POSITIONS: Position[] = [
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

const DEFAULT_FIELD_CONFIG: FieldConfig = {
  'center-field': true,
  'center-left-field': false,
  'center-right-field': false,
};

/**
 * Get active positions based on field configuration
 */
export const getActivePositions = (fieldConfig: FieldConfig = DEFAULT_FIELD_CONFIG): Position[] => {
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
 */
export const shufflePlayers = (players: Player[]): Player[] => {
  return [...players].sort(() => Math.random() - 0.5);
};

/**
 * Generate position assignments for a single inning
 */
export const generateInningPositions = (players: Player[], fieldConfig: FieldConfig = DEFAULT_FIELD_CONFIG): PositionAssignment => {
  if (players.length === 0) {
    return {
      positions: {},
      fieldConfig: { ...fieldConfig }
    };
  }

  const shuffledPlayers = shufflePlayers(players);
  const activePositions = getActivePositions(fieldConfig);
  const positions: Record<string, string> = {};

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
 */
export const generatePositionsForAllInnings = (players: Player[], inningCount: number, fieldConfig: FieldConfig = DEFAULT_FIELD_CONFIG): PositionAssignment[] => {
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
 */
export const generateCurrentInningPositions = (players: Player[], fieldConfig: FieldConfig = DEFAULT_FIELD_CONFIG): PositionAssignment => {
  return generateInningPositions(players, fieldConfig);
};

export { POSITIONS, DEFAULT_FIELD_CONFIG };
