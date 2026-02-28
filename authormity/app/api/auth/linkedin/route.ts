import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/auth/linkedin
 *
 * Initiates the LinkedIn OAuth 2.0 authorization flow for a logged-in user.
 * Generates a CSRF state token, stores it in a secure httpOnly cookie,
 * and redirects the user to LinkedIn's authorization endpoint.
 *
 * Requires an active Clerk session — returns 401 if not authenticated.
 */
export async function GET(): Promise<NextResponse> {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const state = crypto.randomUUID();

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
        state,
        scope: 'openid profile email w_member_social',
    });

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

    const response = NextResponse.redirect(authUrl);

    response.cookies.set('linkedin_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
    });

    return response;
}
