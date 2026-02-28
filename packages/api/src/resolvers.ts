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

  Query: {
    health: () => 'ok',

    mySeasons: async (_: unknown, __: unknown, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.getUserSeasons(userId);
    },

    season: async (_: unknown, args: { id: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      const seasons = await ctx.dal.getUserSeasons(userId);
      return seasons.find((s) => s.id === args.id) ?? null;
    },
  },

  Mutation: {
    createSeason: async (_: unknown, args: { name: string }, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.createSeason(userId, args.name);
    },

    saveLineup: async (
      _: unknown,
      args: {
        input: {
          id?: string;
          seasonId: string;
          gameContext?: object;
          players: object[];
          battingOrder: string[];
          innings: object[];
        };
      },
      ctx: ApiContext
    ) => {
      const userId = requireAuth(ctx);
      return ctx.dal.saveLineup({
        id: args.input.id ?? null,
        seasonId: args.input.seasonId,
        userId,
        gameContext: args.input.gameContext ?? {},
        players: args.input.players,
        battingOrder: args.input.battingOrder,
        innings: args.input.innings,
      });
    },
  },

  Season: {
    lineups: async (parent: { id: string }, _: unknown, ctx: ApiContext) => {
      const userId = requireAuth(ctx);
      return ctx.dal.getSeasonLineups(parent.id, userId);
    },

    createdAt: (parent: { created_at: Date }) => parent.created_at.toISOString(),
  },

  Lineup: {
    gameContext: (parent: { game_context: object }) => parent.game_context,
    battingOrder: (parent: { batting_order: string[] }) => parent.batting_order,
    createdAt: (parent: { created_at: Date }) => parent.created_at.toISOString(),
  },
};
