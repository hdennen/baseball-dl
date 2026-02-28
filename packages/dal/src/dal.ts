import type { Pool } from 'pg';

export function createDAL(pool: Pool) {
  return {
    async getOrCreateUser(stytchUserId: string, email: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_or_create_user($1, $2)',
        [stytchUserId, email]
      );
      const row = rows[0];
      return { id: row.out_id, stytch_user_id: row.out_stytch_user_id, email: row.out_email } as {
        id: string;
        stytch_user_id: string;
        email: string;
      };
    },

    async getUserSeasons(userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_user_seasons($1)',
        [userId]
      );
      return rows as Array<{
        id: string;
        user_id: string;
        name: string;
        status: string;
        stripe_payment_id: string | null;
        paid_by_email: string | null;
        created_at: Date;
        updated_at: Date;
      }>;
    },

    async createSeason(userId: string, name: string) {
      const { rows } = await pool.query(
        'SELECT * FROM create_season($1, $2)',
        [userId, name]
      );
      return rows[0] as {
        id: string;
        user_id: string;
        name: string;
        status: string;
        created_at: Date;
        updated_at: Date;
      };
    },

    async getSeasonLineups(seasonId: string, userId: string) {
      const { rows } = await pool.query(
        'SELECT * FROM get_season_lineups($1, $2)',
        [seasonId, userId]
      );
      return rows as Array<{
        id: string;
        season_id: string;
        game_context: object;
        players: object[];
        batting_order: string[];
        innings: object[];
        created_at: Date;
        updated_at: Date;
      }>;
    },

    async saveLineup(params: {
      id: string | null;
      seasonId: string;
      userId: string;
      gameContext: object;
      players: object[];
      battingOrder: string[];
      innings: object[];
    }) {
      const { rows } = await pool.query(
        'SELECT * FROM save_lineup($1, $2, $3, $4, $5, $6, $7)',
        [
          params.id,
          params.seasonId,
          params.userId,
          JSON.stringify(params.gameContext),
          JSON.stringify(params.players),
          JSON.stringify(params.battingOrder),
          JSON.stringify(params.innings),
        ]
      );
      return rows[0] as {
        id: string;
        season_id: string;
        game_context: object;
        players: object[];
        batting_order: string[];
        innings: object[];
        created_at: Date;
        updated_at: Date;
      };
    },
  };
}

export type DAL = ReturnType<typeof createDAL>;
