import type { Player, FieldConfig, Inning, BattingOrderEntry, Position } from '@baseball-dl/shared';

export type { Player, FieldConfig, Inning, GameContext, BattingOrderEntry, Position, PositionAssignment } from '@baseball-dl/shared';

/**
 * Web-specific GameContext with separate date/time fields.
 * The shared GameContext uses a single `dateTime` field for the API,
 * but the web frontend stores date and time separately.
 */
export interface WebGameContext {
  date: string | null;
  time: string | null;
  opponent: string | null;
  location: string | null;
  side: 'home' | 'away' | null;
  notes: string | null;
}

export interface BaseballStore {
  players: Player[];
  battingOrder: string[];
  unavailablePlayers: string[];
  innings: Inning[];
  currentInningIndex: number;
  showBenchIndicators: boolean;
  gameContext: WebGameContext;

  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;

  assignPosition: (position: string, playerId: string | null) => void;
  randomlyAssignPlayers: () => void;
  fillRemainingPositions: () => void;
  toggleFieldPosition: (position: keyof FieldConfig) => void;

  addEmptyInning: () => void;
  addInningWithCarryOver: () => void;
  removeInning: (index: number) => void;
  setCurrentInning: (index: number) => void;
  reorderInnings: (startIndex: number, endIndex: number) => void;

  addToBattingOrder: (playerId: string) => void;
  removeFromBattingOrder: (playerId: string) => void;
  reorderBattingOrder: (startIndex: number, endIndex: number) => void;
  setBattingOrder: (playerIds: string[]) => void;

  togglePlayerAvailability: (playerId: string) => void;
  getAvailablePlayers: () => Player[];
  getUnavailablePlayerObjects: () => Player[];

  getBenchedPlayers: (inningIndex: number) => Player[];
  wasPlayerBenchedPreviously: (playerId: string) => boolean;
  getPositionLabel: (position: string) => string;
  getActivePositions: (inningIndex: number) => Position[];
  getBattingOrderWithPlayers: () => BattingOrderEntry[];

  toggleBenchIndicators: () => void;

  generatePositionsForAllInnings: (inningCount: number, useCurrentFieldConfig?: boolean) => void;

  updateGameContext: (fields: Partial<WebGameContext>) => void;

  clearAllData: () => void;
}
