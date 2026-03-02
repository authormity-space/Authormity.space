import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { encryptToken } from '@/lib/encryption';
import { getUserProfile } from '@/lib/linkedin';
import { prismaClient } from '@/lib/prisma';

interface LinkedInTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
}

/**
 * GET /api/auth/callback
 *
 * Handles the LinkedIn OAuth 2.0 callback after user authorization.
 *
 * Steps:
 * 1. Validates the CSRF state against the httpOnly cookie.
 * 2. Exchanges the authorization code for an access token.
 * 3. Fetches the LinkedIn user profile (sub, name, email).
 * 4. Encrypts the access token before storing.
 * 5. Upserts the Profile record in Prisma with LinkedIn data.
 * 6. Redirects to /dashboard?linkedin=connected on success.
 */
export async function GET(request: Request): Promise<NextResponse> {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    // Handle LinkedIn-returned errors (e.g. user denied access)
    if (errorParam) {
        return NextResponse.redirect(
            `${origin}/settings?linkedin=error&reason=${encodeURIComponent(errorParam)}`
        );
    }

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state parameter.' }, { status: 400 });
    }

    // Validate CSRF state
    const cookieStore = cookies();
    const storedState = cookieStore.get('linkedin_oauth_state')?.value;

    if (!storedState || storedState !== state) {
        return NextResponse.json({ error: 'Invalid state. Possible CSRF attack.' }, { status: 400 });
    }

    // Clear the state cookie immediately
    const response = NextResponse.redirect(`${origin}/dashboard?linkedin=connected`);
    response.cookies.set('linkedin_oauth_state', '', { maxAge: 0, path: '/' });

    // Require authenticated Clerk session
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Exchange authorization code for access token
    let tokenData: LinkedInTokenResponse;
    try {
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
                client_id: process.env.LINKEDIN_CLIENT_ID!,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            }),
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            console.error('LinkedIn token exchange failed:', errText);
            return NextResponse.redirect(`${origin}/settings?linkedin=error&reason=token_exchange`);
        }

        tokenData = (await tokenRes.json()) as LinkedInTokenResponse;
    } catch (err) {
        console.error('LinkedIn token exchange threw:', err instanceof Error ? err.message : err);
        return NextResponse.redirect(`${origin}/settings?linkedin=error&reason=token_exchange`);
    }

    // Fetch LinkedIn profile (sub = LinkedIn ID)
    let linkedinProfile: Awaited<ReturnType<typeof getUserProfile>>;
    try {
        linkedinProfile = await getUserProfile(tokenData.access_token);
    } catch (err) {
        console.error('LinkedIn profile fetch failed:', err instanceof Error ? err.message : err);
        return NextResponse.redirect(`${origin}/settings?linkedin=error&reason=profile_fetch`);
    }

    // Encrypt token before persisting
    const encryptedToken = encryptToken(tokenData.access_token);
    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

    // Upsert profile in Prisma
    try {
        await prismaClient.profile.update({
            where: { clerkId: userId },
            data: {
                linkedinId: linkedinProfile.linkedinId,
                linkedinToken: encryptedToken,
                linkedinTokenExp: tokenExpiry,
            },
        });
    } catch (err) {
        console.error('Profile upsert failed:', err instanceof Error ? err.message : err);
        return NextResponse.redirect(`${origin}/settings?linkedin=error&reason=db_error`);
    }

    return response;
}
