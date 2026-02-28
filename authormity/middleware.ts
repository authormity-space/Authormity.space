import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
    '/login(.*)',
    '/api/health',
    '/api/webhooks/clerk',
]);

/**
 * Clerk-powered middleware for route authentication.
 * Public routes (/login, /api/health, /api/webhooks/clerk) are accessible without a session.
 * All other routes require an authenticated Clerk session.
 */
export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
