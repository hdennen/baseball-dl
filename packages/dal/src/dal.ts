import type { Pool } from 'pg';

function toISOString(d: Date): string {
  return d.toISOString();
}

function mapAudit(row: { created_by: string; created_at: Date; updated_at: Date }) {
  return {
    createdBy: row.created_by,
    createdAt: toISOString(row.created_at),
    updatedAt: toISOString(row.updated_at),
  };
}

export function createDAL(pool: Pool) {
  return {
    // ============================================================
    // User
    // ============================================================

    async getOrCreateUser(stytchUserId: string, email: string, name?: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_or_create_user($1, $2, $3)',
        [stytchUserId, email, name ?? null]
      );
      const row = rows[0];
      return {
        id: row.out_id as string,
        email: row.out_email as string,
        name: (row.out_name ?? null) as string | null,
      };
    },

    // ============================================================
    // League (secondary)
    // ============================================================

    async createLeague(name: string, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM create_league($1, $2)',
        [name, userId]
      );
      const row = rows[0];
      return {
        id: row.id as string,
        name: row.name as string,
        ...mapAudit(row),
      };
    },

    // ============================================================
    // Season (secondary)
    // ============================================================

    async createSeason(leagueId: string | null, name: string, startDate: string | null, endDate: string | null, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM create_season($1, $2, $3, $4, $5)',
        [leagueId, name, startDate, endDate, userId]
      );
      const row = rows[0];
      return {
        id: row.id as string,
        leagueId: (row.league_id ?? null) as string | null,
        name: row.name as string,
        startDate: row.start_date ? String(row.start_date) : null,
        endDate: row.end_date ? String(row.end_date) : null,
        ...mapAudit(row),
      };
    },

    async getLeagueSeasons(leagueId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_league_seasons($1)',
        [leagueId]
      );
      return rows.map((row) => ({
        id: row.id as string,
        leagueId: (row.league_id ?? null) as string | null,
        name: row.name as string,
        startDate: row.start_date ? String(row.start_date) : null,
        endDate: row.end_date ? String(row.end_date) : null,
        ...mapAudit(row),
      }));
    },

    // ============================================================
    // Team
    // ============================================================

    async createTeam(name: string, seasonId: string | null, leagueId: string | null, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM create_team($1, $2, $3, $4)',
        [name, seasonId, leagueId, userId]
      );
      const row = rows[0];
      return {
        id: row.id as string,
        name: row.name as string,
        seasonId: (row.season_id ?? null) as string | null,
        leagueId: (row.league_id ?? null) as string | null,
        ...mapAudit(row),
      };
    },

    async getUserTeams(userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_user_teams($1)',
        [userId]
      );
      return rows.map((row) => ({
        id: row.id as string,
        name: row.name as string,
        seasonId: (row.season_id ?? null) as string | null,
        leagueId: (row.league_id ?? null) as string | null,
        ...mapAudit(row),
      }));
    },

    async getTeam(teamId: string, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_team($1, $2)',
        [teamId, userId]
      );
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        id: row.id as string,
        name: row.name as string,
        seasonId: (row.season_id ?? null) as string | null,
        leagueId: (row.league_id ?? null) as string | null,
        ...mapAudit(row),
      };
    },

    // ============================================================
    // Team Membership
    // ============================================================

    async addTeamMember(teamId: string, userId: string, role: string, createdBy: string) {
      const { rows } = await pool.query(
        'SELECT * FROM add_team_member($1, $2, $3, $4)',
        [teamId, userId, role, createdBy]
      );
      const row = rows[0];
      return {
        id: row.id as string,
        teamId: row.team_id as string,
        userId: row.user_id as string,
        role: row.role as string,
        ...mapAudit(row),
      };
    },

    async removeTeamMember(teamId: string, userId: string, requestingUserId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM remove_team_member($1, $2, $3)',
        [teamId, userId, requestingUserId]
      );
      return rows[0] as boolean;
    },

    async getTeamMembers(teamId: string, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_team_members($1, $2)',
        [teamId, userId]
      );
      return rows.map((row) => ({
        id: row.out_id as string,
        teamId: row.out_team_id as string,
        userId: row.out_user_id as string,
        role: row.out_role as string,
        userEmail: row.out_user_email as string,
        userName: (row.out_user_name ?? null) as string | null,
        createdBy: row.out_created_by as string,
        createdAt: toISOString(row.out_created_at),
        updatedAt: toISOString(row.out_updated_at),
      }));
    },

    // ============================================================
    // Player and Roster
    // ============================================================

    async createPlayerOnTeam(teamId: string, name: string, number: number | null, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM create_player_on_team($1, $2, $3, $4)',
        [teamId, name, number, userId]
      );
      const row = rows[0];
      return {
        id: row.out_player_id as string,
        name: row.out_name as string,
        number: (row.out_number ?? null) as number | null,
        rosterEntryId: row.out_roster_entry_id as string,
        createdBy: row.out_created_by as string,
        createdAt: toISOString(row.out_created_at),
        updatedAt: toISOString(row.out_updated_at),
      };
    },

    async addPlayerToTeam(playerId: string, teamId: string, number: number | null, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM add_player_to_team($1, $2, $3, $4)',
        [playerId, teamId, number, userId]
      );
      const row = rows[0];
      return {
        id: row.id as string,
        playerId: row.player_id as string,
        teamId: row.team_id as string,
        number: (row.number ?? null) as number | null,
        ...mapAudit(row),
      };
    },

    async updatePlayer(playerId: string, name: string, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM update_player($1, $2, $3)',
        [playerId, name, userId]
      );
      const row = rows[0];
      return {
        id: row.id as string,
        name: row.name as string,
        ...mapAudit(row),
      };
    },

    async updateRosterEntry(rosterEntryId: string, number: number | null, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM update_roster_entry($1, $2, $3)',
        [rosterEntryId, number, userId]
      );
      const row = rows[0];
      return {
        id: row.id as string,
        playerId: row.player_id as string,
        teamId: row.team_id as string,
        number: (row.number ?? null) as number | null,
        ...mapAudit(row),
      };
    },

    async removePlayerFromTeam(playerId: string, teamId: string, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM remove_player_from_team($1, $2, $3)',
        [playerId, teamId, userId]
      );
      return rows[0] as boolean;
    },

    async getTeamPlayers(teamId: string, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_team_players($1, $2)',
        [teamId, userId]
      );
      return rows.map((row) => ({
        id: row.out_player_id as string,
        name: row.out_name as string,
        number: (row.out_number ?? null) as number | null,
        rosterEntryId: row.out_roster_entry_id as string,
        createdBy: row.out_created_by as string,
        createdAt: toISOString(row.out_created_at),
        updatedAt: toISOString(row.out_updated_at),
      }));
    },

    // ============================================================
    // Lineup
    // ============================================================

    async saveLineup(params: {
      id: string | null;
      teamId: string;
      userId: string;
      gameContext: object;
      availablePlayerIds: string[];
      battingOrder: string[];
      innings: object[];
      status?: string;
    }) {
      const { rows } = await pool.query(
        'SELECT * FROM save_lineup($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          params.id,
          params.teamId,
          params.userId,
          JSON.stringify(params.gameContext),
          JSON.stringify(params.availablePlayerIds),
          JSON.stringify(params.battingOrder),
          JSON.stringify(params.innings),
          params.status ?? 'draft',
        ]
      );
      const row = rows[0];
      return {
        id: row.id as string,
        teamId: row.team_id as string,
        gameContext: row.game_context as object,
        availablePlayerIds: row.available_player_ids as string[],
        battingOrder: row.batting_order as string[],
        innings: row.innings as object[],
        status: row.status as string,
        ...mapAudit(row),
      };
    },

    async getTeamLineups(teamId: string, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_team_lineups($1, $2)',
        [teamId, userId]
      );
      return rows.map((row) => ({
        id: row.id as string,
        teamId: row.team_id as string,
        gameContext: row.game_context as object,
        availablePlayerIds: row.available_player_ids as string[],
        battingOrder: row.batting_order as string[],
        innings: row.innings as object[],
        status: row.status as string,
        ...mapAudit(row),
      }));
    },

    async getLineup(lineupId: string, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_lineup($1, $2)',
        [lineupId, userId]
      );
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        id: row.id as string,
        teamId: row.team_id as string,
        gameContext: row.game_context as object,
        availablePlayerIds: row.available_player_ids as string[],
        battingOrder: row.batting_order as string[],
        innings: row.innings as object[],
        status: row.status as string,
        ...mapAudit(row),
      };
    },

    async deleteLineup(lineupId: string, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM delete_lineup($1, $2)',
        [lineupId, userId]
      );
      return rows[0] as boolean;
    },

    // ============================================================
    // Player Relationship (secondary)
    // ============================================================

    async addPlayerRelationship(playerId: string, userId: string, relationship: string, createdBy: string) {
      const { rows } = await pool.query(
        'SELECT * FROM add_player_relationship($1, $2, $3, $4)',
        [playerId, userId, relationship, createdBy]
      );
      const row = rows[0];
      return {
        id: row.id as string,
        playerId: row.player_id as string,
        userId: row.user_id as string,
        relationship: row.relationship as string,
        ...mapAudit(row),
      };
    },

    async getPlayerRelationships(playerId: string, requestingUserId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_player_relationships($1, $2)',
        [playerId, requestingUserId]
      );
      return rows.map((row) => ({
        id: row.id as string,
        playerId: row.player_id as string,
        userId: row.user_id as string,
        relationship: row.relationship as string,
        ...mapAudit(row),
      }));
    },
  };
}

export type DAL = ReturnType<typeof createDAL>;
