// ============================================================
// Audit fields — all timestamps are ISO 8601 UTC (Z suffix)
// ============================================================

export interface AuditFields {
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Domain entities
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface League extends AuditFields {
  id: string;
  name: string;
}

export interface Season extends AuditFields {
  id: string;
  leagueId: string | null;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

export interface Team extends AuditFields {
  id: string;
  name: string;
  seasonId: string | null;
  leagueId: string | null;
}

export type TeamMemberRole = 'head_coach' | 'assistant_coach' | 'parent' | 'scorekeeper';

export interface TeamMembership extends AuditFields {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  userEmail: string;
  userName: string | null;
}

export interface Player extends AuditFields {
  id: string;
  name: string;
}

export interface RosterEntry extends AuditFields {
  id: string;
  playerId: string;
  teamId: string;
  number: number | null;
}

/** Player merged with their roster entry for a specific team. */
export interface TeamPlayer extends AuditFields {
  id: string;
  name: string;
  number: number | null;
  rosterEntryId: string;
}

export interface PlayerRelationship extends AuditFields {
  id: string;
  playerId: string;
  userId: string;
  relationship: string;
}

export type LineupStatus = 'draft' | 'published';

export interface Lineup extends AuditFields {
  id: string;
  teamId: string;
  gameContext: GameContext;
  availablePlayerIds: string[];
  battingOrder: string[];
  innings: Inning[];
  status: LineupStatus;
}

// ============================================================
// Game / field types (used by both web and API)
// ============================================================

export interface GameContext {
  dateTime: string | null;
  opponent: string | null;
  location: string | null;
  side: 'home' | 'away' | null;
  notes: string | null;
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

export interface BattingOrderEntry {
  order: number;
  playerId: string;
  player: Player | undefined;
}
