import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generatePositionsForAllInnings, generateCurrentInningPositions, getActivePositions as getActivePositionsFromService, fillRemainingPositions as fillRemainingPositionsService, POSITIONS } from '../services/PositionGeneratorService';
import type { Player, FieldConfig, GameContext, BattingOrderEntry, Position } from '@baseball-dl/shared';
import type { BaseballStore } from '../types/index';

const DEFAULT_FIELD_CONFIG: FieldConfig = {
  'center-field': true,
  'center-left-field': false,
  'center-right-field': false,
};

const DEFAULT_GAME_CONTEXT: GameContext = {
  date: null,
  time: null,
  opponent: null,
  location: null,
  side: null,
  notes: null,
};

const useBaseballStore = create<BaseballStore>()(
  persist(
    (set, get) => ({
  players: [] as Player[],
  battingOrder: [] as string[],
  innings: [{
    positions: {} as Record<string, string>,
    fieldConfig: { ...DEFAULT_FIELD_CONFIG },
  }],
  currentInningIndex: 0,
  showBenchIndicators: true,
  gameContext: { ...DEFAULT_GAME_CONTEXT },

  addPlayer: (name: string) => {
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random()}`,
      name,
    };
    set((state) => ({
      players: [...state.players, newPlayer],
    }));
  },

  removePlayer: (playerId: string) => {
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
      battingOrder: state.battingOrder.filter((id) => id !== playerId),
      innings: state.innings.map((inning) => ({
        positions: Object.fromEntries(
          Object.entries(inning.positions).filter(([, pId]) => pId !== playerId)
        ),
        fieldConfig: inning.fieldConfig,
      })),
    }));
  },

  assignPosition: (position: string, playerId: string | null) => {
    set((state) => {
      const newInnings = [...state.innings];
      const currentInning = { ...newInnings[state.currentInningIndex] };

      const newPositions = Object.fromEntries(
        Object.entries(currentInning.positions).filter(([, pId]) => pId !== playerId)
      );

      if (playerId) {
        newPositions[position] = playerId;
      } else {
        delete newPositions[position];
      }

      newInnings[state.currentInningIndex] = {
        positions: newPositions,
        fieldConfig: currentInning.fieldConfig,
      };

      return { innings: newInnings };
    });
  },

  addEmptyInning: () => {
    set((state) => {
      if (state.innings.length >= 9) return state;
      const lastInning = state.innings[state.innings.length - 1];
      const newInnings = [...state.innings, {
        positions: {},
        fieldConfig: { ...lastInning.fieldConfig },
      }];
      return {
        innings: newInnings,
        currentInningIndex: newInnings.length - 1,
      };
    });
  },

  addInningWithCarryOver: () => {
    set((state) => {
      if (state.innings.length >= 9) return state;
      const lastInning = state.innings[state.innings.length - 1];
      const newInnings = [...state.innings, {
        positions: { ...lastInning.positions },
        fieldConfig: { ...lastInning.fieldConfig },
      }];
      return {
        innings: newInnings,
        currentInningIndex: newInnings.length - 1,
      };
    });
  },

  removeInning: (index: number) => {
    set((state) => {
      if (state.innings.length <= 1) return state;

      const newInnings = state.innings.filter((_, i) => i !== index);

      let newCurrentIndex = state.currentInningIndex;
      if (index === state.currentInningIndex) {
        newCurrentIndex = Math.max(0, index - 1);
      } else if (index < state.currentInningIndex) {
        newCurrentIndex = state.currentInningIndex - 1;
      }

      return {
        innings: newInnings,
        currentInningIndex: newCurrentIndex,
      };
    });
  },

  setCurrentInning: (index: number) => {
    set({ currentInningIndex: index });
  },

  reorderInnings: (startIndex: number, endIndex: number) => {
    set((state) => {
      const newInnings = Array.from(state.innings);
      const [removed] = newInnings.splice(startIndex, 1);
      newInnings.splice(endIndex, 0, removed);

      let newCurrentIndex = state.currentInningIndex;
      if (state.currentInningIndex === startIndex) {
        newCurrentIndex = endIndex;
      } else if (startIndex < state.currentInningIndex && endIndex >= state.currentInningIndex) {
        newCurrentIndex = state.currentInningIndex - 1;
      } else if (startIndex > state.currentInningIndex && endIndex <= state.currentInningIndex) {
        newCurrentIndex = state.currentInningIndex + 1;
      }

      return {
        innings: newInnings,
        currentInningIndex: newCurrentIndex,
      };
    });
  },

  randomlyAssignPlayers: () => {
    set((state) => {
      if (state.players.length === 0) return state;

      const newInnings = [...state.innings];
      const currentInning = newInnings[state.currentInningIndex];
      const generatedInning = generateCurrentInningPositions(state.players, currentInning.fieldConfig);
      newInnings[state.currentInningIndex] = generatedInning;

      return { innings: newInnings };
    });
  },

  fillRemainingPositions: () => {
    set((state) => {
      if (state.players.length === 0) return state;

      const newInnings = [...state.innings];
      const currentInning = newInnings[state.currentInningIndex];
      const newPositions = fillRemainingPositionsService(
        currentInning.positions,
        state.players,
        currentInning.fieldConfig
      );

      if (newPositions === currentInning.positions) return state;

      newInnings[state.currentInningIndex] = {
        positions: newPositions,
        fieldConfig: currentInning.fieldConfig,
      };

      return { innings: newInnings };
    });
  },

  getBenchedPlayers: (inningIndex: number): Player[] => {
    const state = get();
    const inning = state.innings[inningIndex];
    if (!inning) return [];

    const assignedPlayerIds = new Set(Object.values(inning.positions));
    return state.players.filter((player) => !assignedPlayerIds.has(player.id));
  },

  wasPlayerBenchedPreviously: (playerId: string): boolean => {
    const state = get();
    const currentIndex = state.currentInningIndex;

    for (let i = 0; i < currentIndex; i++) {
      const inning = state.innings[i];
      const assignedPlayerIds = Object.values(inning.positions);
      if (!assignedPlayerIds.includes(playerId)) {
        return true;
      }
    }
    return false;
  },

  toggleBenchIndicators: () => {
    set((state) => ({
      showBenchIndicators: !state.showBenchIndicators,
    }));
  },

  getPositionLabel: (position: string): string => {
    return position
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  getActivePositions: (inningIndex: number): Position[] => {
    const state = get();
    const inning = state.innings[inningIndex];
    if (!inning || !inning.fieldConfig) {
      return POSITIONS;
    }

    return getActivePositionsFromService(inning.fieldConfig);
  },

  toggleFieldPosition: (position: keyof FieldConfig) => {
    set((state) => {
      const newInnings = [...state.innings];
      const currentInning = { ...newInnings[state.currentInningIndex] };
      const newFieldConfig = { ...currentInning.fieldConfig };

      newFieldConfig[position] = !newFieldConfig[position];

      const newPositions = { ...currentInning.positions };
      if (!newFieldConfig[position] && newPositions[position]) {
        delete newPositions[position];
      }

      newInnings[state.currentInningIndex] = {
        positions: newPositions,
        fieldConfig: newFieldConfig,
      };

      return { innings: newInnings };
    });
  },

  addToBattingOrder: (playerId: string) => {
    set((state) => {
      if (state.battingOrder.includes(playerId)) return state;
      return {
        battingOrder: [...state.battingOrder, playerId],
      };
    });
  },

  removeFromBattingOrder: (playerId: string) => {
    set((state) => ({
      battingOrder: state.battingOrder.filter((id) => id !== playerId),
    }));
  },

  reorderBattingOrder: (startIndex: number, endIndex: number) => {
    set((state) => {
      const newBattingOrder = Array.from(state.battingOrder);
      const [removed] = newBattingOrder.splice(startIndex, 1);
      newBattingOrder.splice(endIndex, 0, removed);
      return { battingOrder: newBattingOrder };
    });
  },

  setBattingOrder: (playerIds: string[]) => {
    set({ battingOrder: playerIds });
  },

  getBattingOrderWithPlayers: (): BattingOrderEntry[] => {
    const state = get();
    return state.battingOrder.map((playerId, index) => ({
      order: index + 1,
      playerId,
      player: state.players.find(p => p.id === playerId),
    })).filter(item => item.player);
  },

  generatePositionsForAllInnings: (inningCount: number, useCurrentFieldConfig = true) => {
    set((state) => {
      if (state.players.length === 0) {
        throw new Error('No players available to assign positions');
      }

      const fieldConfig = useCurrentFieldConfig
        ? state.innings[state.currentInningIndex]?.fieldConfig || { ...DEFAULT_FIELD_CONFIG }
        : { ...DEFAULT_FIELD_CONFIG };

      const newInnings = generatePositionsForAllInnings(state.players, inningCount, fieldConfig);

      return {
        innings: newInnings,
        currentInningIndex: 0,
      };
    });
  },

  updateGameContext: (fields: Partial<GameContext>) => {
    set((state) => ({
      gameContext: { ...state.gameContext, ...fields },
    }));
  },

  clearAllData: () => {
    set({
      players: [],
      battingOrder: [],
      innings: [{
        positions: {},
        fieldConfig: { ...DEFAULT_FIELD_CONFIG },
      }],
      currentInningIndex: 0,
      showBenchIndicators: true,
      gameContext: { ...DEFAULT_GAME_CONTEXT },
    });
  },
}),
    {
      name: 'baseball-lineup-storage',
      version: 1,
      partialize: (state) => ({
        players: state.players,
        battingOrder: state.battingOrder,
        innings: state.innings,
        currentInningIndex: state.currentInningIndex,
        showBenchIndicators: state.showBenchIndicators,
        gameContext: state.gameContext,
      }),
    }
  )
);

export { POSITIONS };
export default useBaseballStore;
