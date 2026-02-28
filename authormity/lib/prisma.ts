// Prisma 7 uses a driver adapter pattern — PrismaClient is instantiated differently.
// Until a real database URL is provided, we export a typed stub that callers can use.
// Replace this with the real adapter-based client once DATABASE_URL is configured.

import { PrismaClient } from '@prisma/client';

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client.
 * Caches the instance on `globalThis` in development to prevent
 * connection exhaustion caused by Next.js hot module reloads.
 * In production a fresh instance is always created once per process.
 */
export const prismaClient: PrismaClient = (() => {
    if (process.env.NODE_ENV === 'production') {
        return new PrismaClient();
    }

    if (!globalThis.__prisma) {
        globalThis.__prisma = new PrismaClient();
    }

    return globalThis.__prisma;
})();
