import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

/**
 * Creates a Prisma client backed by the Neon serverless HTTP/WebSocket driver.
 * Uses port 443 (WebSocket) instead of port 5432 (TCP), so it works on
 * any network — including ISPs that block outbound PostgreSQL traffic.
 */
function createPrismaClient(): PrismaClient {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
    return new PrismaClient({ adapter } as unknown as ConstructorParameters<typeof PrismaClient>[0]);
}

/**
 * Lazy-initialized singleton Prisma client.
 *
 * IMPORTANT: Uses a getter instead of an eagerly-invoked IIFE so the Neon
 * adapter is NOT created at module-import time. During Vercel's build phase
 * DATABASE_URL is unavailable and the Neon WebSocket driver would crash
 * with `TypeError: Cannot read properties of undefined (reading 'bind')`.
 *
 * In development the instance is cached on `globalThis` to survive HMR.
 */
function getPrismaClient(): PrismaClient {
    if (process.env.NODE_ENV === 'production') {
        if (!globalThis.__prisma) {
            globalThis.__prisma = createPrismaClient();
        }
        return globalThis.__prisma;
    }

    // Development: also cache on globalThis to avoid connection exhaustion
    if (!globalThis.__prisma) {
        globalThis.__prisma = createPrismaClient();
    }
    return globalThis.__prisma;
}

/**
 * Prisma client singleton — lazily created on first property access.
 * Safe to import at the top level of any file; no DB connection is
 * attempted until you actually call a method like `.profile.findUnique()`.
 */
export const prismaClient = new Proxy({} as PrismaClient, {
    get(_target, prop, receiver) {
        const client = getPrismaClient();
        const value = Reflect.get(client, prop, receiver);
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});
