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
 * Singleton Prisma client.
 * Caches the instance on `globalThis` in development to prevent
 * connection exhaustion caused by Next.js hot module reloads.
 */
export const prismaClient: PrismaClient = (() => {
    if (process.env.NODE_ENV === 'production') {
        return createPrismaClient();
    }

    if (!globalThis.__prisma) {
        globalThis.__prisma = createPrismaClient();
    }

    return globalThis.__prisma;
})();
