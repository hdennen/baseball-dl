import type { Player, FieldConfig, Inning, GameContext, BattingOrderEntry, Position } from '@baseball-dl/shared';

export type { Player, FieldConfig, Inning, GameContext, BattingOrderEntry, Position, PositionAssignment } from '@baseball-dl/shared';

export interface BaseballStore {
  players: Player[];
  battingOrder: string[];
  unavailablePlayers: string[];
  innings: Inning[];
  currentInningIndex: number;
  showBenchIndicators: boolean;
  gameContext: GameContext;

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

  updateGameContext: (fields: Partial<GameContext>) => void;

  clearAllData: () => void;
}
