import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Initiates LinkedIn OAuth by redirecting to LinkedIn's authorization endpoint.
 * Requires an active Clerk session.
 * @param request - The incoming GET request.
 */
export async function GET(request: Request): Promise<NextResponse> {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

    const state = Buffer.from(JSON.stringify({ userId, redirectTo })).toString('base64');
    const scope = ['openid', 'profile', 'email', 'w_member_social'].join(' ');

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
}
