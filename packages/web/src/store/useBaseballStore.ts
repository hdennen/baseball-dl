import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generatePositionsForAllInnings, generateCurrentInningPositions, getActivePositions as getActivePositionsFromService, fillRemainingPositions as fillRemainingPositionsService, POSITIONS } from '../services/PositionGeneratorService';
import type { Player, FieldConfig, BattingOrderEntry, Position, Lineup, LineupStatus, TeamPlayer } from '@baseball-dl/shared';
import type { BaseballStore, WebGameContext } from '../types/index';

const DEFAULT_FIELD_CONFIG: FieldConfig = {
  'center-field': true,
  'center-left-field': false,
  'center-right-field': false,
};

const DEFAULT_GAME_CONTEXT: WebGameContext = {
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
  allTeamPlayers: [] as TeamPlayer[],
  battingOrder: [] as string[],
  unavailablePlayers: [] as string[],
  innings: [{
    positions: {} as Record<string, string>,
    fieldConfig: { ...DEFAULT_FIELD_CONFIG },
  }],
  currentInningIndex: 0,
  showBenchIndicators: true,
  gameContext: { ...DEFAULT_GAME_CONTEXT },
  currentTeamId: null as string | null,
  currentTeamName: null as string | null,
  currentLineupId: null as string | null,
  currentLineupStatus: null as LineupStatus | null,

  isReadOnly: (): boolean => {
    return get().currentLineupStatus === 'published';
  },

  loadLineup: (lineup: Lineup) => {
    let date: string | null = null;
    let time: string | null = null;
    if (lineup.gameContext?.dateTime) {
      const dt = new Date(lineup.gameContext.dateTime);
      date = dt.toISOString().split('T')[0];
      const hours = dt.getHours().toString().padStart(2, '0');
      const minutes = dt.getMinutes().toString().padStart(2, '0');
      time = `${hours}:${minutes}`;
    }

    const removedPlayerIds = new Set(
      get().allTeamPlayers
        .filter((p) => p.removedAt)
        .map((p) => p.id)
    );
    const shouldFilterRemoved = lineup.status === 'draft' && removedPlayerIds.size > 0;

    let battingOrder = lineup.battingOrder;
    let availablePlayerIds = lineup.availablePlayerIds;

    const innings = lineup.innings.map((inn) => {
      const fc = inn.fieldConfig as unknown as Record<string, boolean>;
      let positions = inn.positions as Record<string, string>;

      if (shouldFilterRemoved) {
        positions = Object.fromEntries(
          Object.entries(positions).filter(([, pId]) => !removedPlayerIds.has(pId))
        );
      }

      return {
        positions,
        fieldConfig: {
          'center-field': fc['center-field'] ?? fc.centerField ?? true,
          'center-left-field': fc['center-left-field'] ?? fc.centerLeftField ?? false,
          'center-right-field': fc['center-right-field'] ?? fc.centerRightField ?? false,
        },
      };
    });

    if (shouldFilterRemoved) {
      battingOrder = battingOrder.filter((id) => !removedPlayerIds.has(id));
      availablePlayerIds = availablePlayerIds.filter((id) => !removedPlayerIds.has(id));
    }

    set({
      currentLineupId: lineup.id,
      currentLineupStatus: lineup.status,
      battingOrder,
      unavailablePlayers: get().players
        .map((p) => p.id)
        .filter((id) => !availablePlayerIds.includes(id)),
      innings: innings.length > 0 ? innings : [{
        positions: {},
        fieldConfig: { ...DEFAULT_FIELD_CONFIG },
      }],
      currentInningIndex: 0,
      gameContext: {
        date,
        time,
        opponent: lineup.gameContext?.opponent ?? null,
        location: lineup.gameContext?.location ?? null,
        side: lineup.gameContext?.side ?? null,
        notes: lineup.gameContext?.notes ?? null,
      },
    });
  },

  clearLineup: () => {
    set({
      currentLineupId: null,
      currentLineupStatus: null,
      battingOrder: [],
      unavailablePlayers: [],
      innings: [{
        positions: {},
        fieldConfig: { ...DEFAULT_FIELD_CONFIG },
      }],
      currentInningIndex: 0,
      gameContext: { ...DEFAULT_GAME_CONTEXT },
    });
  },

  setLineupMeta: (id: string, status: LineupStatus) => {
    set({ currentLineupId: id, currentLineupStatus: status });
  },

  setCurrentTeam: (teamId: string | null, teamName?: string | null) => {
    set({
      currentTeamId: teamId,
      currentTeamName: teamName ?? null,
      currentLineupId: null,
      currentLineupStatus: null,
      players: [],
      allTeamPlayers: [],
      battingOrder: [],
      unavailablePlayers: [],
      innings: [{
        positions: {},
        fieldConfig: { ...DEFAULT_FIELD_CONFIG },
      }],
      currentInningIndex: 0,
    });
  },

  loadTeamPlayers: (players: Player[]) => {
    set({ players });
  },

  loadAllTeamPlayers: (players: TeamPlayer[]) => {
    set({ allTeamPlayers: players });
  },

  migrateToTeam: (teamId: string, idMap: Record<string, string>) => {
    set((state) => {
      const remap = (id: string) => idMap[id] ?? id;

      return {
        currentTeamId: teamId,
        players: state.players.map((p) => ({
          ...p,
          id: remap(p.id),
        })),
        battingOrder: state.battingOrder.map(remap),
        unavailablePlayers: state.unavailablePlayers.map(remap),
        innings: state.innings.map((inning) => ({
          ...inning,
          positions: Object.fromEntries(
            Object.entries(inning.positions).map(([pos, pid]) => [pos, remap(pid)])
          ),
        })),
      };
    });
  },

  addPlayer: (name: string) => {
    const newPlayer = {
      id: `player-${Date.now()}-${Math.random()}`,
      name,
    } as Player;
    set((state) => ({
      players: [...state.players, newPlayer],
    }));
  },

  removePlayer: (playerId: string) => {
    set((state) => {
      const isPublished = state.currentLineupStatus === 'published';

      if (isPublished) {
        return {
          players: state.players.filter((p) => p.id !== playerId),
        };
      }

      return {
        players: state.players.filter((p) => p.id !== playerId),
        battingOrder: state.battingOrder.filter((id) => id !== playerId),
        unavailablePlayers: state.unavailablePlayers.filter((id) => id !== playerId),
        innings: state.innings.map((inning) => ({
          positions: Object.fromEntries(
            Object.entries(inning.positions).filter(([, pId]) => pId !== playerId)
          ),
          fieldConfig: inning.fieldConfig,
        })),
      };
    });
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
      const availablePlayers = state.players.filter(
        (p) => !state.unavailablePlayers.includes(p.id)
      );
      if (availablePlayers.length === 0) return state;

      const newInnings = [...state.innings];
      const currentInning = newInnings[state.currentInningIndex];
      const generatedInning = generateCurrentInningPositions(availablePlayers, currentInning.fieldConfig);
      newInnings[state.currentInningIndex] = generatedInning;

      return { innings: newInnings };
    });
  },

  fillRemainingPositions: () => {
    set((state) => {
      const availablePlayers = state.players.filter(
        (p) => !state.unavailablePlayers.includes(p.id)
      );
      if (availablePlayers.length === 0) return state;

      const newInnings = [...state.innings];
      const currentInning = newInnings[state.currentInningIndex];
      const newPositions = fillRemainingPositionsService(
        currentInning.positions,
        availablePlayers,
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

    const basePlayers = state.players.filter(
      (player) => !assignedPlayerIds.has(player.id) && !state.unavailablePlayers.includes(player.id)
    );

    if (!state.isPublished) return basePlayers;

    const activeIds = new Set(state.players.map(p => p.id));
    const removedOnBench = state.allTeamPlayers
      .filter(tp => tp.removedAt && !assignedPlayerIds.has(tp.id) && !activeIds.has(tp.id))
      .map(tp => ({ id: tp.id, name: tp.name, createdBy: tp.createdBy, createdAt: tp.createdAt, updatedAt: tp.updatedAt }));

    return [...basePlayers, ...removedOnBench];
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

  togglePlayerAvailability: (playerId: string) => {
    set((state) => {
      const isCurrentlyUnavailable = state.unavailablePlayers.includes(playerId);

      if (isCurrentlyUnavailable) {
        return {
          unavailablePlayers: state.unavailablePlayers.filter((id) => id !== playerId),
        };
      }

      return {
        unavailablePlayers: [...state.unavailablePlayers, playerId],
        battingOrder: state.battingOrder.filter((id) => id !== playerId),
        innings: state.innings.map((inning) => ({
          positions: Object.fromEntries(
            Object.entries(inning.positions).filter(([, pId]) => pId !== playerId)
          ),
          fieldConfig: inning.fieldConfig,
        })),
      };
    });
  },

  getAvailablePlayers: (): Player[] => {
    const state = get();
    return state.players.filter((p) => !state.unavailablePlayers.includes(p.id));
  },

  getUnavailablePlayerObjects: (): Player[] => {
    const state = get();
    return state.players.filter((p) => state.unavailablePlayers.includes(p.id));
  },

  getPlayerById: (playerId: string): Player | undefined => {
    const state = get();
    const active = state.players.find(p => p.id === playerId);
    if (active) return active;
    const fromFull = state.allTeamPlayers.find(p => p.id === playerId);
    if (fromFull) return { id: fromFull.id, name: fromFull.name, createdBy: fromFull.createdBy, createdAt: fromFull.createdAt, updatedAt: fromFull.updatedAt };
    return undefined;
  },

  isPlayerRemoved: (playerId: string): boolean => {
    const state = get();
    const tp = state.allTeamPlayers.find(p => p.id === playerId);
    return !!tp?.removedAt;
  },

  getBattingOrderWithPlayers: (): BattingOrderEntry[] => {
    const state = get();
    return state.battingOrder.map((playerId, index) => ({
      order: index + 1,
      playerId,
      player: state.players.find(p => p.id === playerId)
        ?? (state.allTeamPlayers.find(p => p.id === playerId)
          ? { id: playerId, name: state.allTeamPlayers.find(p => p.id === playerId)!.name, createdBy: '', createdAt: '', updatedAt: '' }
          : undefined),
    })).filter(item => item.player);
  },

  generatePositionsForAllInnings: (inningCount: number, useCurrentFieldConfig = true) => {
    set((state) => {
      const availablePlayers = state.players.filter(
        (p) => !state.unavailablePlayers.includes(p.id)
      );
      if (availablePlayers.length === 0) {
        throw new Error('No players available to assign positions');
      }

      const fieldConfig = useCurrentFieldConfig
        ? state.innings[state.currentInningIndex]?.fieldConfig || { ...DEFAULT_FIELD_CONFIG }
        : { ...DEFAULT_FIELD_CONFIG };

      const newInnings = generatePositionsForAllInnings(availablePlayers, inningCount, fieldConfig);

      return {
        innings: newInnings,
        currentInningIndex: 0,
      };
    });
  },

  updateGameContext: (fields: Partial<WebGameContext>) => {
    set((state) => ({
      gameContext: { ...state.gameContext, ...fields },
    }));
  },

  clearAllData: () => {
    set({
      players: [],
      allTeamPlayers: [],
      battingOrder: [],
      unavailablePlayers: [],
      innings: [{
        positions: {},
        fieldConfig: { ...DEFAULT_FIELD_CONFIG },
      }],
      currentInningIndex: 0,
      showBenchIndicators: true,
      gameContext: { ...DEFAULT_GAME_CONTEXT },
      currentLineupId: null,
      currentLineupStatus: null,
    });
  },
}),
    {
      name: 'baseball-lineup-storage',
      version: 1,
      partialize: (state) => ({
        players: state.players,
        allTeamPlayers: state.allTeamPlayers,
        battingOrder: state.battingOrder,
        unavailablePlayers: state.unavailablePlayers,
        innings: state.innings,
        currentInningIndex: state.currentInningIndex,
        showBenchIndicators: state.showBenchIndicators,
        gameContext: state.gameContext,
        currentTeamId: state.currentTeamId,
        currentTeamName: state.currentTeamName,
        currentLineupId: state.currentLineupId,
        currentLineupStatus: state.currentLineupStatus,
      }),
    }
  )
);

export { POSITIONS };
export default useBaseballStore;
