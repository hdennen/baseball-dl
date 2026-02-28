import type { Request } from 'express';
import type { DAL } from '@baseball-dl/dal';

export interface ApiContext {
  dal: DAL;
  userId: string | null;
}

export function createContextBuilder(dal: DAL) {
  return async ({ req }: { req: Request }): Promise<ApiContext> => {
    // Dev stub: read user ID from header for testing.
    // Real Stytch JWT verification replaces this later.
    const userId = req.headers['x-user-id'] as string | undefined;

    return {
      dal,
      userId: userId ?? null,
    };
  };
}
