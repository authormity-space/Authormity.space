/** Tracks AI call timestamps per user+action key. */
const store = new Map<string, number[]>();

const LIMITS: Record<string, number> = {
    post_generate: 20,
    repurpose: 10,
    comment_generate: 30,
    breakdown: 20,
    linkedin_publish: 10,
};

const DEFAULT_LIMIT = 15;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Checks and enforces per-user rate limits for AI-powered actions.
 * Uses an in-memory store — intended to be replaced with Redis in production.
 *
 * Limits (per hour per user):
 * - post_generate: 20
 * - repurpose: 10
 * - comment_generate: 30
 * - breakdown: 20
 * - all others: 15
 *
 * @param userId - The Clerk user ID to track.
 * @param action - The action key to rate-limit (e.g. 'post_generate').
 * @throws A user-friendly error with minutes remaining if the limit is exceeded.
 */
export function checkRateLimit(userId: string, action: string): void {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    // Retrieve existing timestamps and purge entries older than 1 hour
    const timestamps = (store.get(key) ?? []).filter((ts) => ts > windowStart);

    const limit = LIMITS[action] ?? DEFAULT_LIMIT;

    if (timestamps.length >= limit) {
        // Calculate how many minutes until the oldest entry falls out of the window
        const oldestTs = timestamps[0];
        const minutesLeft = Math.ceil((oldestTs + WINDOW_MS - now) / 60_000);
        throw new Error(
            `Rate limit exceeded. You can use this feature again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`
        );
    }

    // Record this call
    timestamps.push(now);
    store.set(key, timestamps);
}
