import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error || !code) {
        return NextResponse.redirect(`${origin}/login?error=oauth_error`);
    }

    let redirectTo = '/dashboard';
    if (state) {
        try {
            const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf-8')) as { redirectTo?: string };
            redirectTo = parsed.redirectTo ?? '/dashboard';
        } catch {
            // Use default redirectTo
        }
    }

    const supabase = createServerSupabaseClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
        return NextResponse.redirect(`${origin}/login?error=session_exchange_failed`);
    }

    return NextResponse.redirect(`${origin}${redirectTo}`);
}
