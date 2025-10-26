// Type definitions for the baseball application

export interface Player {
  id: string;
  name: string;
}

export interface FieldConfig {
  'center-field': boolean;
  'center-left-field': boolean;
  'center-right-field': boolean;
}

export interface Inning {
  positions: Record<string, string>; // position -> playerId
  fieldConfig: FieldConfig;
}

export interface BaseballStore {
  players: Player[];
  battingOrder: string[]; // array of player IDs
  innings: Inning[];
  currentInningIndex: number;
  
  // Actions
  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerName: (playerId: string, name: string) => void;
  setBattingOrder: (order: string[]) => void;
  addInning: () => void;
  removeInning: (index: number) => void;
  setCurrentInningIndex: (index: number) => void;
  updateInningPositions: (inningIndex: number, positions: Record<string, string>) => void;
  updateInningFieldConfig: (inningIndex: number, fieldConfig: FieldConfig) => void;
  generatePositionsForAllInnings: (inningCount: number) => void;
  generateCurrentInningPositions: () => void;
  clearAllInnings: () => void;
}

// Service types
export type Position = 
  | 'pitcher'
  | 'catcher'
  | 'first-base'
  | 'second-base'
  | 'shortstop'
  | 'third-base'
  | 'left-field'
  | 'center-left-field'
  | 'center-field'
  | 'center-right-field'
  | 'right-field';

export interface PositionAssignment {
  positions: Record<string, string>;
  fieldConfig: FieldConfig;
}
