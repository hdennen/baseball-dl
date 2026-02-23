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

export interface GameContext {
  date: string | null;
  time: string | null;
  opponent: string | null;
  location: string | null;
  side: 'home' | 'away' | null;
  notes: string | null;
}

export interface BattingOrderEntry {
  order: number;
  playerId: string;
  player: Player | undefined;
}

export interface BaseballStore {
  // State
  players: Player[];
  battingOrder: string[];
  innings: Inning[];
  currentInningIndex: number;
  showBenchIndicators: boolean;
  gameContext: GameContext;

  // Player actions
  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;

  // Position actions
  assignPosition: (position: string, playerId: string | null) => void;
  randomlyAssignPlayers: () => void;
  fillRemainingPositions: () => void;
  toggleFieldPosition: (position: keyof FieldConfig) => void;

  // Inning actions
  addEmptyInning: () => void;
  addInningWithCarryOver: () => void;
  removeInning: (index: number) => void;
  setCurrentInning: (index: number) => void;
  reorderInnings: (startIndex: number, endIndex: number) => void;

  // Batting order actions
  addToBattingOrder: (playerId: string) => void;
  removeFromBattingOrder: (playerId: string) => void;
  reorderBattingOrder: (startIndex: number, endIndex: number) => void;
  setBattingOrder: (playerIds: string[]) => void;

  // Getter-style actions (use `get()` internally)
  getBenchedPlayers: (inningIndex: number) => Player[];
  wasPlayerBenchedPreviously: (playerId: string) => boolean;
  getPositionLabel: (position: string) => string;
  getActivePositions: (inningIndex: number) => Position[];
  getBattingOrderWithPlayers: () => BattingOrderEntry[];

  // UI state actions
  toggleBenchIndicators: () => void;

  // Generation
  generatePositionsForAllInnings: (inningCount: number, useCurrentFieldConfig?: boolean) => void;

  // Game context
  updateGameContext: (fields: Partial<GameContext>) => void;

  // Reset
  clearAllData: () => void;
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
