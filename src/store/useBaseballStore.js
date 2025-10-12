import { create } from 'zustand';

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

const useBaseballStore = create((set, get) => ({
  // Players array - each player has id and name
  players: [],
  
  // Innings array - each inning contains position assignments
  // innings[inningIndex] = { positions: { 'pitcher': playerId, ... } }
  innings: [{ positions: {} }], // Start with one empty inning
  
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
      // Also remove player from all innings
      innings: state.innings.map((inning) => ({
        positions: Object.fromEntries(
          Object.entries(inning.positions).filter(([_, pId]) => pId !== playerId)
        ),
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
      
      newInnings[state.currentInningIndex] = { positions: newPositions };
      
      return { innings: newInnings };
    });
  },
  
  // Add an empty inning
  addEmptyInning: () => {
    set((state) => {
      if (state.innings.length >= 9) return state; // Max 9 innings
      return {
        innings: [...state.innings, { positions: {} }],
      };
    });
  },
  
  // Add an inning with positions carried over from the previous one
  addInningWithCarryOver: () => {
    set((state) => {
      if (state.innings.length >= 9) return state; // Max 9 innings
      const lastInning = state.innings[state.innings.length - 1];
      return {
        innings: [...state.innings, { positions: { ...lastInning.positions } }],
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
}));

export { POSITIONS };
export default useBaseballStore;

