import type { Request } from 'express';
import type { DAL } from '@baseball-dl/dal';

export interface ApiContext {
  dal: DAL;
  userId: string | null;
}

export function createContextBuilder(dal: DAL) {
  return async ({ req }: { req: Request }): Promise<ApiContext> => {
    const stytchUserId = req.headers['x-user-id'] as string | undefined;
    const email = req.headers['x-user-email'] as string | undefined;

    if (!stytchUserId) {
      return { dal, userId: null };
    }

    // Resolve Stytch user ID to internal UUID via upsert.
    // Requires email on first call to create the user record.
    const user = await dal.getOrCreateUser(
      stytchUserId,
      email ?? `${stytchUserId}@placeholder.local`,
    );

    return {
      dal,
      userId: user.id,
    };
  };
}
