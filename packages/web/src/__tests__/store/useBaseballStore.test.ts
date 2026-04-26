import { describe, it, expect, beforeEach } from 'vitest';
import useBaseballStore from '../../store/useBaseballStore';
import type { Lineup } from '@baseball-dl/shared';

function resetStore() {
  useBaseballStore.getState().clearAllData();
  useBaseballStore.setState({
    currentTeamId: null,
    currentTeamName: null,
  });
}

function seedPlayers() {
  useBaseballStore.setState({
    players: [
      { id: 'p1', name: 'Alice', createdBy: 'u1', createdAt: '', updatedAt: '' },
      { id: 'p2', name: 'Bob', createdBy: 'u1', createdAt: '', updatedAt: '' },
      { id: 'p3', name: 'Charlie', createdBy: 'u1', createdAt: '', updatedAt: '' },
    ],
  });
}

beforeEach(resetStore);

describe('useBaseballStore', () => {
  describe('loadLineup', () => {
    it('splits dateTime into separate date and time', () => {
      seedPlayers();
      const dateTimeStr = '2026-06-15T18:30:00.000Z';
      const dt = new Date(dateTimeStr);
      const expectedDate = dt.toISOString().split('T')[0];
      const expectedTime = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;

      const lineup: Lineup = {
        id: 'lineup-1',
        teamId: 'team-1',
        gameContext: {
          dateTime: dateTimeStr,
          opponent: 'Mets',
          location: 'Field 3',
          side: 'home',
          notes: 'Bring snacks',
        },
        availablePlayerIds: ['p1', 'p2', 'p3'],
        battingOrder: ['p1', 'p2'],
        innings: [
          {
            positions: { pitcher: 'p1' },
            fieldConfig: {
              'center-field': true,
              'center-left-field': false,
              'center-right-field': false,
            },
          },
        ],
        status: 'draft',
        createdBy: 'u1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      useBaseballStore.getState().loadLineup(lineup);
      const state = useBaseballStore.getState();

      expect(state.currentLineupId).toBe('lineup-1');
      expect(state.currentLineupStatus).toBe('draft');
      expect(state.gameContext.date).toBe(expectedDate);
      expect(state.gameContext.time).toBe(expectedTime);
      expect(state.gameContext.opponent).toBe('Mets');
      expect(state.gameContext.location).toBe('Field 3');
      expect(state.gameContext.side).toBe('home');
      expect(state.gameContext.notes).toBe('Bring snacks');
    });

    it('handles null dateTime', () => {
      const lineup: Lineup = {
        id: 'lineup-2',
        teamId: 'team-1',
        gameContext: { dateTime: null, opponent: null, location: null, side: null, notes: null },
        availablePlayerIds: [],
        battingOrder: [],
        innings: [],
        status: 'draft',
        createdBy: 'u1',
        createdAt: '',
        updatedAt: '',
      };

      useBaseballStore.getState().loadLineup(lineup);
      const ctx = useBaseballStore.getState().gameContext;
      expect(ctx.date).toBeNull();
      expect(ctx.time).toBeNull();
    });

    it('maps fieldConfig kebab-case keys from API to store format', () => {
      const lineup: Lineup = {
        id: 'lineup-3',
        teamId: 'team-1',
        gameContext: { dateTime: null, opponent: null, location: null, side: null, notes: null },
        availablePlayerIds: [],
        battingOrder: [],
        innings: [
          {
            positions: {},
            fieldConfig: {
              'center-field': false,
              'center-left-field': true,
              'center-right-field': true,
            },
          },
        ],
        status: 'published',
        createdBy: 'u1',
        createdAt: '',
        updatedAt: '',
      };

      useBaseballStore.getState().loadLineup(lineup);
      const fc = useBaseballStore.getState().innings[0].fieldConfig;
      expect(fc['center-field']).toBe(false);
      expect(fc['center-left-field']).toBe(true);
      expect(fc['center-right-field']).toBe(true);
    });

    it('computes unavailablePlayers from players minus availablePlayerIds', () => {
      seedPlayers();

      const lineup: Lineup = {
        id: 'lineup-4',
        teamId: 'team-1',
        gameContext: { dateTime: null, opponent: null, location: null, side: null, notes: null },
        availablePlayerIds: ['p1', 'p3'],
        battingOrder: [],
        innings: [],
        status: 'draft',
        createdBy: 'u1',
        createdAt: '',
        updatedAt: '',
      };

      useBaseballStore.getState().loadLineup(lineup);
      expect(useBaseballStore.getState().unavailablePlayers).toEqual(['p2']);
    });

    it('provides default inning when lineup has empty innings', () => {
      const lineup: Lineup = {
        id: 'lineup-5',
        teamId: 'team-1',
        gameContext: { dateTime: null, opponent: null, location: null, side: null, notes: null },
        availablePlayerIds: [],
        battingOrder: [],
        innings: [],
        status: 'draft',
        createdBy: 'u1',
        createdAt: '',
        updatedAt: '',
      };

      useBaseballStore.getState().loadLineup(lineup);
      expect(useBaseballStore.getState().innings).toHaveLength(1);
      expect(useBaseballStore.getState().innings[0].positions).toEqual({});
    });
  });

  describe('clearLineup', () => {
    it('resets lineup state while preserving players and team', () => {
      seedPlayers();
      useBaseballStore.setState({
        currentTeamId: 'team-1',
        currentTeamName: 'Sox',
        currentLineupId: 'lineup-1',
        currentLineupStatus: 'published',
        battingOrder: ['p1', 'p2'],
      });

      useBaseballStore.getState().clearLineup();
      const state = useBaseballStore.getState();

      expect(state.currentLineupId).toBeNull();
      expect(state.currentLineupStatus).toBeNull();
      expect(state.battingOrder).toEqual([]);
      expect(state.currentTeamId).toBe('team-1');
      expect(state.players).toHaveLength(3);
    });
  });

  describe('assignPosition', () => {
    it('assigns a player to a position in the current inning', () => {
      seedPlayers();
      useBaseballStore.getState().assignPosition('pitcher', 'p1');
      expect(useBaseballStore.getState().innings[0].positions.pitcher).toBe('p1');
    });

    it('removes player from previous position when reassigned', () => {
      seedPlayers();
      useBaseballStore.getState().assignPosition('pitcher', 'p1');
      useBaseballStore.getState().assignPosition('catcher', 'p1');

      const positions = useBaseballStore.getState().innings[0].positions;
      expect(positions.pitcher).toBeUndefined();
      expect(positions.catcher).toBe('p1');
    });

    it('clears a position when null is passed', () => {
      seedPlayers();
      useBaseballStore.getState().assignPosition('pitcher', 'p1');
      useBaseballStore.getState().assignPosition('pitcher', null);
      expect(useBaseballStore.getState().innings[0].positions.pitcher).toBeUndefined();
    });
  });

  describe('inning management', () => {
    it('addEmptyInning creates a new inning with inherited field config', () => {
      useBaseballStore.getState().addEmptyInning();
      const state = useBaseballStore.getState();
      expect(state.innings).toHaveLength(2);
      expect(state.innings[1].positions).toEqual({});
      expect(state.currentInningIndex).toBe(1);
    });

    it('addInningWithCarryOver copies positions from previous inning', () => {
      seedPlayers();
      useBaseballStore.getState().assignPosition('pitcher', 'p1');
      useBaseballStore.getState().addInningWithCarryOver();

      const state = useBaseballStore.getState();
      expect(state.innings).toHaveLength(2);
      expect(state.innings[1].positions.pitcher).toBe('p1');
    });

    it('caps innings at 9', () => {
      for (let i = 0; i < 10; i++) {
        useBaseballStore.getState().addEmptyInning();
      }
      expect(useBaseballStore.getState().innings.length).toBeLessThanOrEqual(9);
    });

    it('removeInning adjusts currentInningIndex correctly', () => {
      useBaseballStore.getState().addEmptyInning();
      useBaseballStore.getState().addEmptyInning();
      useBaseballStore.getState().setCurrentInning(2);

      useBaseballStore.getState().removeInning(1);
      expect(useBaseballStore.getState().innings).toHaveLength(2);
      expect(useBaseballStore.getState().currentInningIndex).toBe(1);
    });

    it('does not remove the last inning', () => {
      useBaseballStore.getState().removeInning(0);
      expect(useBaseballStore.getState().innings).toHaveLength(1);
    });
  });

  describe('removePlayer', () => {
    it('removes player from all innings, batting order, and unavailable list', () => {
      seedPlayers();
      useBaseballStore.getState().assignPosition('pitcher', 'p1');
      useBaseballStore.getState().addToBattingOrder('p1');
      useBaseballStore.getState().togglePlayerAvailability('p1');
      useBaseballStore.getState().togglePlayerAvailability('p1');

      useBaseballStore.getState().removePlayer('p1');
      const state = useBaseballStore.getState();

      expect(state.players.find((p) => p.id === 'p1')).toBeUndefined();
      expect(state.innings[0].positions.pitcher).toBeUndefined();
      expect(state.battingOrder).not.toContain('p1');
    });
  });

  describe('togglePlayerAvailability', () => {
    it('marks a player unavailable and removes from batting order and innings', () => {
      seedPlayers();
      useBaseballStore.getState().assignPosition('pitcher', 'p1');
      useBaseballStore.getState().addToBattingOrder('p1');

      useBaseballStore.getState().togglePlayerAvailability('p1');
      const state = useBaseballStore.getState();

      expect(state.unavailablePlayers).toContain('p1');
      expect(state.battingOrder).not.toContain('p1');
      expect(state.innings[0].positions.pitcher).toBeUndefined();
    });

    it('marks a player available again', () => {
      seedPlayers();
      useBaseballStore.getState().togglePlayerAvailability('p1');
      useBaseballStore.getState().togglePlayerAvailability('p1');
      expect(useBaseballStore.getState().unavailablePlayers).not.toContain('p1');
    });
  });

  describe('batting order', () => {
    it('addToBattingOrder appends player', () => {
      useBaseballStore.getState().addToBattingOrder('p1');
      useBaseballStore.getState().addToBattingOrder('p2');
      expect(useBaseballStore.getState().battingOrder).toEqual(['p1', 'p2']);
    });

    it('addToBattingOrder is idempotent', () => {
      useBaseballStore.getState().addToBattingOrder('p1');
      useBaseballStore.getState().addToBattingOrder('p1');
      expect(useBaseballStore.getState().battingOrder).toEqual(['p1']);
    });

    it('reorderBattingOrder moves player', () => {
      useBaseballStore.getState().addToBattingOrder('p1');
      useBaseballStore.getState().addToBattingOrder('p2');
      useBaseballStore.getState().addToBattingOrder('p3');

      useBaseballStore.getState().reorderBattingOrder(2, 0);
      expect(useBaseballStore.getState().battingOrder).toEqual(['p3', 'p1', 'p2']);
    });
  });

  describe('setCurrentTeam', () => {
    it('resets lineup state when switching teams', () => {
      seedPlayers();
      useBaseballStore.setState({
        currentLineupId: 'lineup-1',
        battingOrder: ['p1'],
      });

      useBaseballStore.getState().setCurrentTeam('new-team', 'New Team');
      const state = useBaseballStore.getState();

      expect(state.currentTeamId).toBe('new-team');
      expect(state.currentTeamName).toBe('New Team');
      expect(state.currentLineupId).toBeNull();
      expect(state.players).toEqual([]);
      expect(state.battingOrder).toEqual([]);
    });
  });

  describe('migrateToTeam', () => {
    it('remaps all player IDs using the provided map', () => {
      seedPlayers();
      useBaseballStore.getState().assignPosition('pitcher', 'p1');
      useBaseballStore.getState().addToBattingOrder('p1');
      useBaseballStore.getState().addToBattingOrder('p2');
      useBaseballStore.getState().togglePlayerAvailability('p3');

      useBaseballStore.getState().migrateToTeam('new-team', {
        p1: 'server-p1',
        p2: 'server-p2',
        p3: 'server-p3',
      });

      const state = useBaseballStore.getState();
      expect(state.currentTeamId).toBe('new-team');
      expect(state.players.map((p) => p.id)).toEqual(['server-p1', 'server-p2', 'server-p3']);
      expect(state.battingOrder).toEqual(['server-p1', 'server-p2']);
      expect(state.unavailablePlayers).toEqual(['server-p3']);
      expect(state.innings[0].positions.pitcher).toBe('server-p1');
    });
  });

  describe('isReadOnly', () => {
    it('returns true when lineup is published', () => {
      useBaseballStore.setState({ currentLineupStatus: 'published' });
      expect(useBaseballStore.getState().isReadOnly()).toBe(true);
    });

    it('returns false when lineup is draft', () => {
      useBaseballStore.setState({ currentLineupStatus: 'draft' });
      expect(useBaseballStore.getState().isReadOnly()).toBe(false);
    });

    it('returns false when no lineup loaded', () => {
      expect(useBaseballStore.getState().isReadOnly()).toBe(false);
    });
  });

  describe('getBenchedPlayers', () => {
    it('returns players not assigned to any position in the given inning', () => {
      seedPlayers();
      useBaseballStore.getState().assignPosition('pitcher', 'p1');

      const benched = useBaseballStore.getState().getBenchedPlayers(0);
      expect(benched.map((p) => p.id)).toEqual(['p2', 'p3']);
    });

    it('excludes unavailable players from benched list', () => {
      seedPlayers();
      useBaseballStore.getState().togglePlayerAvailability('p3');

      const benched = useBaseballStore.getState().getBenchedPlayers(0);
      expect(benched.map((p) => p.id)).toEqual(['p1', 'p2']);
    });
  });

  describe('toggleFieldPosition', () => {
    it('toggles a field config option and removes displaced player', () => {
      seedPlayers();
      useBaseballStore.getState().assignPosition('center-field', 'p1');
      useBaseballStore.getState().toggleFieldPosition('center-field');

      const state = useBaseballStore.getState();
      expect(state.innings[0].fieldConfig['center-field']).toBe(false);
      expect(state.innings[0].positions['center-field']).toBeUndefined();
    });
  });
});
