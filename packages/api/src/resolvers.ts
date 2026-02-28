import { GraphQLError } from 'graphql';
import type { ApiContext } from './context.js';

function requireAuth(ctx: ApiContext): string {
  if (!ctx.userId) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.userId;
}

export const resolvers = {
  JSON: {
    __serialize: (value: unknown) => value,
    __parseValue: (value: unknown) => value,
    __parseLiteral: (ast: { kind: string; value?: string }) => {
      if (ast.kind === 'StringValue' && ast.value) {
        return JSON.parse(ast.value);
      }
      return null;
    },
  },

  // ============================================================
  // Queries
  // ============================================================

  Query: {
    health: () => 'ok',

    me: async (_: unknown, __: unknown, ctx: ApiContext) => {
      if (!ctx.userId) return null;
      return { id: ctx.userId };
    },

    myTeams: async (_: unknown, __: unknown, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.getUserTeams(userId);
    },

    team: async (_: unknown, args: { id: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.getTeam(args.id, userId);
    },

    teamPlayers: async (_: unknown, args: { teamId: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.getTeamPlayers(args.teamId, userId);
    },

    teamLineups: async (_: unknown, args: { teamId: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.getTeamLineups(args.teamId, userId);
    },

    lineup: async (_: unknown, args: { id: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.getLineup(args.id, userId);
    },
  },

  // ============================================================
  // Mutations
  // ============================================================

  Mutation: {
    createTeam: async (_: unknown, args: { name: string; seasonId?: string; leagueId?: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.createTeam(args.name, args.seasonId ?? null, args.leagueId ?? null, userId);
    },

    createPlayerOnTeam: async (_: unknown, args: { teamId: string; name: string; number?: number }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.createPlayerOnTeam(args.teamId, args.name, args.number ?? null, userId);
    },

    addPlayerToTeam: async (_: unknown, args: { playerId: string; teamId: string; number?: number }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.addPlayerToTeam(args.playerId, args.teamId, args.number ?? null, userId);
    },

    updatePlayer: async (_: unknown, args: { id: string; name: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.updatePlayer(args.id, args.name, userId);
    },

    updateRosterEntry: async (_: unknown, args: { id: string; number?: number }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.updateRosterEntry(args.id, args.number ?? null, userId);
    },

    removePlayerFromTeam: async (_: unknown, args: { playerId: string; teamId: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.removePlayerFromTeam(args.playerId, args.teamId, userId);
    },

    saveLineup: async (
      _: unknown,
      args: {
        input: {
          id?: string;
          teamId: string;
          gameContext?: { dateTime?: string; opponent?: string; location?: string; side?: string; notes?: string };
          availablePlayerIds: string[];
          battingOrder: string[];
          innings: Array<{ positions: Record<string, string>; fieldConfig: { centerField: boolean; centerLeftField: boolean; centerRightField: boolean } }>;
          status?: string;
        };
      },
      ctx: ApiContext
    ) => {
      const userId = requireAuth(ctx);
      const innings = args.input.innings.map((inn) => ({
        positions: inn.positions,
        fieldConfig: {
          'center-field': inn.fieldConfig.centerField,
          'center-left-field': inn.fieldConfig.centerLeftField,
          'center-right-field': inn.fieldConfig.centerRightField,
        },
      }));

      return ctx.dal.saveLineup({
        id: args.input.id ?? null,
        teamId: args.input.teamId,
        userId,
        gameContext: args.input.gameContext ?? {},
        availablePlayerIds: args.input.availablePlayerIds,
        battingOrder: args.input.battingOrder,
        innings,
        status: args.input.status ?? 'draft',
      });
    },

    deleteLineup: async (_: unknown, args: { id: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.deleteLineup(args.id, userId);
    },

    addTeamMember: async (_: unknown, args: { teamId: string; userId: string; role: string }, ctx: ApiContext) => {
      const createdBy = requireAuth(ctx);
      return ctx.dal.addTeamMember(args.teamId, args.userId, args.role, createdBy);
    },

    removeTeamMember: async (_: unknown, args: { teamId: string; userId: string }, ctx: ApiContext) => {
      const requestingUserId = requireAuth(ctx);
      return ctx.dal.removeTeamMember(args.teamId, args.userId, requestingUserId);
    },

    createLeague: async (_: unknown, args: { name: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.createLeague(args.name, userId);
    },

    createSeason: async (_: unknown, args: { leagueId?: string; name: string; startDate?: string; endDate?: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.createSeason(args.leagueId ?? null, args.name, args.startDate ?? null, args.endDate ?? null, userId);
    },
  },

  // ============================================================
  // Field resolvers
  // ============================================================

  Team: {
    players: async (parent: { id: string }, _: unknown, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.getTeamPlayers(parent.id, userId);
    },

    lineups: async (parent: { id: string }, _: unknown, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.getTeamLineups(parent.id, userId);
    },

    members: async (parent: { id: string }, _: unknown, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.getTeamMembers(parent.id, userId);
    },
  },

  League: {
    seasons: async (parent: { id: string }, _: unknown, ctx: ApiContext) => {
      requireAuth(ctx);
      return ctx.dal.getLeagueSeasons(parent.id);
    },
  },

  Lineup: {
    gameContext: (parent: { gameContext?: object; game_context?: object }) => {
      return parent.gameContext ?? parent.game_context ?? {};
    },

    availablePlayerIds: (parent: { availablePlayerIds?: string[]; available_player_ids?: string[] }) => {
      return parent.availablePlayerIds ?? parent.available_player_ids ?? [];
    },

    battingOrder: (parent: { battingOrder?: string[]; batting_order?: string[] }) => {
      return parent.battingOrder ?? parent.batting_order ?? [];
    },

    innings: (parent: { innings: Array<{ positions: Record<string, string>; fieldConfig?: object; field_config?: object }> }) => {
      return parent.innings;
    },
  },

  Inning: {
    fieldConfig: (parent: { fieldConfig?: Record<string, boolean>; field_config?: Record<string, boolean> }) => {
      const cfg = parent.fieldConfig ?? parent.field_config ?? {};
      return {
        centerField: (cfg as Record<string, boolean>)['center-field'] ?? false,
        centerLeftField: (cfg as Record<string, boolean>)['center-left-field'] ?? false,
        centerRightField: (cfg as Record<string, boolean>)['center-right-field'] ?? false,
      };
    },
  },

  GameContext: {
    dateTime: (parent: Record<string, unknown>) => parent.dateTime ?? parent.date_time ?? null,
    opponent: (parent: Record<string, unknown>) => parent.opponent ?? null,
    location: (parent: Record<string, unknown>) => parent.location ?? null,
    side: (parent: Record<string, unknown>) => parent.side ?? null,
    notes: (parent: Record<string, unknown>) => parent.notes ?? null,
  },
};
