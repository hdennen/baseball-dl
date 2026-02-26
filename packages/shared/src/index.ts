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
  positions: Record<string, string>;
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
