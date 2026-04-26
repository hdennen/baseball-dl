import { describe, it, expect } from 'vitest';
import {
  getActivePositions,
  generateInningPositions,
  generatePositionsForAllInnings,
  fillRemainingPositions,
  POSITIONS,
} from '../../services/PositionGeneratorService';
import type { FieldConfig, Player } from '@baseball-dl/shared';

const DEFAULT_CONFIG: FieldConfig = {
  'center-field': true,
  'center-left-field': false,
  'center-right-field': false,
};

const SPLIT_CF_CONFIG: FieldConfig = {
  'center-field': false,
  'center-left-field': true,
  'center-right-field': true,
};

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    createdBy: 'u1',
    createdAt: '',
    updatedAt: '',
  }));
}

describe('PositionGeneratorService', () => {
  describe('getActivePositions', () => {
    it('returns 9 positions with default config (single center fielder)', () => {
      const active = getActivePositions(DEFAULT_CONFIG);
      expect(active).toHaveLength(9);
      expect(active).toContain('center-field');
      expect(active).not.toContain('center-left-field');
      expect(active).not.toContain('center-right-field');
    });

    it('returns 10 positions with split center field config', () => {
      const active = getActivePositions(SPLIT_CF_CONFIG);
      expect(active).toHaveLength(10);
      expect(active).not.toContain('center-field');
      expect(active).toContain('center-left-field');
      expect(active).toContain('center-right-field');
    });

    it('always includes non-configurable positions', () => {
      const active = getActivePositions(DEFAULT_CONFIG);
      for (const pos of ['pitcher', 'catcher', 'first-base', 'second-base', 'shortstop', 'third-base', 'left-field', 'right-field']) {
        expect(active).toContain(pos);
      }
    });
  });

  describe('generateInningPositions', () => {
    it('assigns players to active positions', () => {
      const players = makePlayers(10);
      const result = generateInningPositions(players, DEFAULT_CONFIG);

      const assignedCount = Object.keys(result.positions).length;
      expect(assignedCount).toBe(9);
      expect(result.fieldConfig).toEqual(DEFAULT_CONFIG);
    });

    it('handles fewer players than positions', () => {
      const players = makePlayers(3);
      const result = generateInningPositions(players, DEFAULT_CONFIG);
      expect(Object.keys(result.positions).length).toBe(3);
    });

    it('returns empty positions for empty player array', () => {
      const result = generateInningPositions([], DEFAULT_CONFIG);
      expect(result.positions).toEqual({});
    });
  });

  describe('generatePositionsForAllInnings', () => {
    it('generates the requested number of innings', () => {
      const players = makePlayers(10);
      const result = generatePositionsForAllInnings(players, 6, DEFAULT_CONFIG);
      expect(result).toHaveLength(6);
      result.forEach((inning) => {
        expect(Object.keys(inning.positions).length).toBe(9);
      });
    });

    it('throws for empty players', () => {
      expect(() => generatePositionsForAllInnings([], 3, DEFAULT_CONFIG)).toThrow(
        'No players available',
      );
    });
  });

  describe('fillRemainingPositions', () => {
    it('fills only empty positions, preserving existing assignments', () => {
      const players = makePlayers(10);
      const existing = { pitcher: 'p1', catcher: 'p2' };

      const result = fillRemainingPositions(existing, players, DEFAULT_CONFIG);

      expect(result.pitcher).toBe('p1');
      expect(result.catcher).toBe('p2');
      expect(Object.keys(result).length).toBe(9);
    });

    it('does not double-assign a player already in a position', () => {
      const players = makePlayers(10);
      const existing = { pitcher: 'p1' };

      const result = fillRemainingPositions(existing, players, DEFAULT_CONFIG);
      const assignedPlayers = Object.values(result);
      const unique = new Set(assignedPlayers);
      expect(unique.size).toBe(assignedPlayers.length);
    });

    it('returns original positions when all positions are filled', () => {
      const players = makePlayers(10);
      const positions = getActivePositions(DEFAULT_CONFIG);
      const existing: Record<string, string> = {};
      positions.forEach((pos, i) => {
        existing[pos] = `p${i + 1}`;
      });

      const result = fillRemainingPositions(existing, players, DEFAULT_CONFIG);
      expect(result).toBe(existing);
    });

    it('returns original positions when no players available', () => {
      const existing = { pitcher: 'p1' };
      const players = makePlayers(1);

      const result = fillRemainingPositions(existing, players, DEFAULT_CONFIG);
      expect(result).toBe(existing);
    });
  });

  describe('POSITIONS constant', () => {
    it('contains all 11 possible positions', () => {
      expect(POSITIONS).toHaveLength(11);
    });
  });
});
