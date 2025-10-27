import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generatePositionsForAllInnings, generateCurrentInningPositions, getActivePositions as getActivePositionsFromService, fillRemainingPositions as fillRemainingPositionsService, POSITIONS } from '../services/PositionGeneratorService';


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
  
  // Show bench indicators in lineup editor
  showBenchIndicators: true,
  
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
      
      // Use the service to generate positions for the current inning
      const generatedInning = generateCurrentInningPositions(state.players, currentInning.fieldConfig);
      
      newInnings[state.currentInningIndex] = generatedInning;
      
      return { innings: newInnings };
    });
  },

  // Fill only the remaining empty positions in the current inning
  fillRemainingPositions: () => {
    set((state) => {
      if (state.players.length === 0) return state;
      
      const newInnings = [...state.innings];
      const currentInning = newInnings[state.currentInningIndex];
      
      // Use the service to fill remaining positions
      const newPositions = fillRemainingPositionsService(
        currentInning.positions,
        state.players,
        currentInning.fieldConfig
      );
      
      // If nothing changed, return the same state
      if (newPositions === currentInning.positions) return state;
      
      newInnings[state.currentInningIndex] = {
        positions: newPositions,
        fieldConfig: currentInning.fieldConfig,
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
  
  // Check if a player was benched in any previous inning (before current inning)
  wasPlayerBenchedPreviously: (playerId) => {
    const state = get();
    const currentIndex = state.currentInningIndex;
    
    // Check all previous innings (not including the current one)
    for (let i = 0; i < currentIndex; i++) {
      const inning = state.innings[i];
      const assignedPlayerIds = Object.values(inning.positions);
      if (!assignedPlayerIds.includes(playerId)) {
        return true; // Player was benched in this previous inning
      }
    }
    return false;
  },
  
  // Toggle bench indicators visibility
  toggleBenchIndicators: () => {
    set((state) => ({
      showBenchIndicators: !state.showBenchIndicators,
    }));
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
    
    return getActivePositionsFromService(inning.fieldConfig);
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

  // Generate positions for all innings
  generatePositionsForAllInnings: async (inningCount, useCurrentFieldConfig = true) => {
    set((state) => {
      if (state.players.length === 0) {
        throw new Error('No players available to assign positions');
      }

      // Get the field config to use
      const fieldConfig = useCurrentFieldConfig 
        ? state.innings[state.currentInningIndex]?.fieldConfig || {
            'center-field': true,
            'center-left-field': false,
            'center-right-field': false,
          }
        : {
            'center-field': true,
            'center-left-field': false,
            'center-right-field': false,
          };

      // Use the service to generate all innings
      const newInnings = generatePositionsForAllInnings(state.players, inningCount, fieldConfig);

      return {
        innings: newInnings,
        currentInningIndex: 0, // Reset to first inning
      };
    });
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
      showBenchIndicators: true,
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
        showBenchIndicators: state.showBenchIndicators,
      }),
    }
  )
);

export { POSITIONS };
export default useBaseballStore;

