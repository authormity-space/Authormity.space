'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

/**
 * Marketing panel shown on the left side of the login screen (desktop only).
 * Communicates the core value proposition of Authormity.space.
 */
function MarketingPanel() {
    return (
        <div className="hidden lg:flex flex-col justify-between bg-[#0A0A0A] p-12 text-white lg:w-1/2">
            <div>
                <p className="text-2xl font-bold text-[#0A66C2]">Authormity</p>
            </div>

            <div className="space-y-8">
                <h1 className="text-4xl font-bold leading-tight tracking-tight">
                    Write less. Sound more like yourself. Grow faster.
                </h1>

                <ul className="space-y-4 text-lg text-white/80">
                    <li className="flex items-center gap-3">
                        <span className="text-[#0A66C2] font-bold">✓</span>
                        AI that writes in your voice
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-[#0A66C2] font-bold">✓</span>
                        Repurpose any content in seconds
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-[#0A66C2] font-bold">✓</span>
                        Schedule and publish to LinkedIn
                    </li>
                </ul>
            </div>

            <p className="text-sm text-white/40">Join 10,000+ LinkedIn creators</p>
        </div>
    );
}

/**
 * Login page for Authormity.space.
 *
 * Desktop: two-column layout — dark marketing panel on the left,
 * sign-in panel on the right.
 *
 * Mobile: full-screen sign-in panel only.
 *
 * Authentication is handled entirely by Clerk's <SignIn /> component,
 * which includes LinkedIn OAuth as a social login option alongside
 * email/password. The custom /api/auth/linkedin route is separate —
 * it connects a LinkedIn account for publishing AFTER the user is
 * already logged in, and lives on the /settings page.
 */
export default function LoginPage() {
    return (
        <div className="flex min-h-screen">
            <MarketingPanel />

            {/* Sign-in panel */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12 lg:w-1/2">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo — visible on mobile only */}
                    <p className="text-center text-2xl font-bold text-[#0A66C2] lg:hidden">
                        Authormity
                    </p>

                    <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-sm text-muted-foreground">
                            Sign in to continue to Authormity.space
                        </p>
                    </div>

                    {/* Clerk handles all auth — LinkedIn OAuth button is shown
              automatically when LinkedIn is enabled as a social provider
              in the Clerk dashboard. */}
                    <div className="flex justify-center">
                        <SignIn
                            afterSignInUrl="/dashboard"
                            afterSignUpUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: 'w-full',
                                    card: 'shadow-none p-4 w-full',
                                    footer: 'hidden',
                                },
                            }}
                        />
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        By signing in you agree to our{' '}
                        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
