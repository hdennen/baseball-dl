import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

const useBaseballStore = create(
  persist(
    (set, get) => ({
  // Players array - each player has id and name
  players: [],
  
  // Batting order - array of player IDs in batting order
  battingOrder: [],
  
  // Innings array - each inning contains position assignments
  // innings[inningIndex] = { positions: { 'pitcher': playerId, ... }, fieldConfig: {...} }
  innings: [{ 
    positions: {},
    fieldConfig: {
      'center-field': true,
      'center-left-field': false,
      'center-right-field': false,
    }
  }], // Start with one empty inning with default field config
  
  // Currently selected inning for editing
  currentInningIndex: 0,
  
  // Add a new player
  addPlayer: (name) => {
    const newPlayer = {
      id: `player-${Date.now()}-${Math.random()}`,
      name,
    };
    set((state) => ({
      players: [...state.players, newPlayer],
    }));
  },
  
  // Remove a player
  removePlayer: (playerId) => {
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
      // Also remove player from batting order
      battingOrder: state.battingOrder.filter((id) => id !== playerId),
      // Also remove player from all innings
      innings: state.innings.map((inning) => ({
        positions: Object.fromEntries(
          Object.entries(inning.positions).filter(([_, pId]) => pId !== playerId)
        ),
        fieldConfig: inning.fieldConfig,
      })),
    }));
  },
  
  // Assign a player to a position in the current inning
  assignPosition: (position, playerId) => {
    set((state) => {
      const newInnings = [...state.innings];
      const currentInning = { ...newInnings[state.currentInningIndex] };
      
      // Remove player from any current position in this inning
      const newPositions = Object.fromEntries(
        Object.entries(currentInning.positions).filter(([_, pId]) => pId !== playerId)
      );
      
      // Assign to new position (or unassign if playerId is null)
      if (playerId) {
        newPositions[position] = playerId;
      } else {
        delete newPositions[position];
      }
      
      newInnings[state.currentInningIndex] = { 
        positions: newPositions,
        fieldConfig: currentInning.fieldConfig 
      };
      
      return { innings: newInnings };
    });
  },
  
  // Add an empty inning
  addEmptyInning: () => {
    set((state) => {
      if (state.innings.length >= 9) return state; // Max 9 innings
      // Carry over field config from previous inning
      const lastInning = state.innings[state.innings.length - 1];
      const newInnings = [...state.innings, { 
        positions: {},
        fieldConfig: { ...lastInning.fieldConfig }
      }];
      return {
        innings: newInnings,
        currentInningIndex: newInnings.length - 1, // Switch to the new inning
      };
    });
  },
  
  // Add an inning with positions carried over from the previous one
  addInningWithCarryOver: () => {
    set((state) => {
      if (state.innings.length >= 9) return state; // Max 9 innings
      const lastInning = state.innings[state.innings.length - 1];
      const newInnings = [...state.innings, { 
        positions: { ...lastInning.positions },
        fieldConfig: { ...lastInning.fieldConfig }
      }];
      return {
        innings: newInnings,
        currentInningIndex: newInnings.length - 1, // Switch to the new inning
      };
    });
  },
  
  // Remove an inning
  removeInning: (index) => {
    set((state) => {
      if (state.innings.length <= 1) return state; // Must have at least 1 inning
      
      const newInnings = state.innings.filter((_, i) => i !== index);
      
      // Adjust current inning index if necessary
      let newCurrentIndex = state.currentInningIndex;
      if (index === state.currentInningIndex) {
        // If we're deleting the current inning, move to the previous one (or 0)
        newCurrentIndex = Math.max(0, index - 1);
      } else if (index < state.currentInningIndex) {
        // If we're deleting an inning before the current one, adjust the index
        newCurrentIndex = state.currentInningIndex - 1;
      }
      
      return {
        innings: newInnings,
        currentInningIndex: newCurrentIndex,
      };
    });
  },
  
  // Set the current inning being edited
  setCurrentInning: (index) => {
    set({ currentInningIndex: index });
  },

  // Reorder innings (for drag and drop)
  reorderInnings: (startIndex, endIndex) => {
    set((state) => {
      const newInnings = Array.from(state.innings);
      const [removed] = newInnings.splice(startIndex, 1);
      newInnings.splice(endIndex, 0, removed);

      // Adjust currentInningIndex if necessary
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
  
  // Randomly assign players to positions in the current inning
  randomlyAssignPlayers: () => {
    set((state) => {
      if (state.players.length === 0) return state;
      
      const newInnings = [...state.innings];
      const currentInning = newInnings[state.currentInningIndex];
      const shuffledPlayers = [...state.players].sort(() => Math.random() - 0.5);
      
      // Get active positions based on field config
      const activePositions = get().getActivePositions(state.currentInningIndex);
      
      const newPositions = {};
      activePositions.forEach((position, index) => {
        if (index < shuffledPlayers.length) {
          newPositions[position] = shuffledPlayers[index].id;
        }
      });
      
      newInnings[state.currentInningIndex] = { 
        positions: newPositions,
        fieldConfig: currentInning.fieldConfig
      };
      
      return { innings: newInnings };
    });
  },

  // Get benched players for a specific inning
  getBenchedPlayers: (inningIndex) => {
    const state = get();
    const inning = state.innings[inningIndex];
    if (!inning) return [];
    
    const assignedPlayerIds = new Set(Object.values(inning.positions));
    return state.players.filter((player) => !assignedPlayerIds.has(player.id));
  },
  
  // Get position label (human readable)
  getPositionLabel: (position) => {
    return position
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },
  
  // Get active positions for a specific inning based on field config
  getActivePositions: (inningIndex) => {
    const state = get();
    const inning = state.innings[inningIndex];
    if (!inning || !inning.fieldConfig) {
      return POSITIONS; // Return all positions if no config
    }
    
    return POSITIONS.filter((position) => {
      // Only filter the configurable positions
      if (position === 'center-field' || position === 'center-left-field' || position === 'center-right-field') {
        return inning.fieldConfig[position] === true;
      }
      return true; // All other positions are always active
    });
  },
  
  // Toggle a field position (and move players to bench if disabled)
  toggleFieldPosition: (position) => {
    set((state) => {
      const newInnings = [...state.innings];
      const currentInning = { ...newInnings[state.currentInningIndex] };
      const newFieldConfig = { ...currentInning.fieldConfig };
      
      // Toggle the position
      newFieldConfig[position] = !newFieldConfig[position];
      
      // If disabling the position, remove any player from that position
      let newPositions = { ...currentInning.positions };
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
  
  // Add player to batting order
  addToBattingOrder: (playerId) => {
    set((state) => {
      if (state.battingOrder.includes(playerId)) return state;
      return {
        battingOrder: [...state.battingOrder, playerId],
      };
    });
  },

  // Remove player from batting order
  removeFromBattingOrder: (playerId) => {
    set((state) => ({
      battingOrder: state.battingOrder.filter((id) => id !== playerId),
    }));
  },

  // Reorder batting order (for drag and drop)
  reorderBattingOrder: (startIndex, endIndex) => {
    set((state) => {
      const newBattingOrder = Array.from(state.battingOrder);
      const [removed] = newBattingOrder.splice(startIndex, 1);
      newBattingOrder.splice(endIndex, 0, removed);
      return { battingOrder: newBattingOrder };
    });
  },

  // Set entire batting order
  setBattingOrder: (playerIds) => {
    set({ battingOrder: playerIds });
  },

  // Get batting order with player details
  getBattingOrderWithPlayers: () => {
    const state = get();
    return state.battingOrder.map((playerId, index) => ({
      order: index + 1,
      playerId,
      player: state.players.find(p => p.id === playerId),
    })).filter(item => item.player); // Only include players that still exist
  },

  // Clear all data and reset to initial state
  clearAllData: () => {
    set({
      players: [],
      battingOrder: [],
      innings: [{ 
        positions: {},
        fieldConfig: {
          'center-field': true,
          'center-left-field': false,
          'center-right-field': false,
        }
      }],
      currentInningIndex: 0,
    });
  },
}),
    {
      name: 'baseball-lineup-storage', // localStorage key
      version: 1, // version number for migrations if needed
      partialize: (state) => ({
        // Only persist these specific fields
        players: state.players,
        battingOrder: state.battingOrder,
        innings: state.innings,
        currentInningIndex: state.currentInningIndex,
      }),
    }
  )
);

export { POSITIONS };
export default useBaseballStore;

