'use client';

import { SignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Linkedin } from 'lucide-react';
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
 * Provides LinkedIn OAuth as the primary sign-in method
 * (redirects to /api/auth/linkedin), with Clerk's <SignIn />
 * component below as an email fallback.
 */
export default function LoginPage() {
    function handleLinkedInSignIn() {
        window.location.href = '/api/auth/linkedin';
    }

    return (
        <div className="flex min-h-screen">
            <MarketingPanel />

            {/* Sign-in panel */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12 lg:w-1/2">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo — visible on mobile (marketing panel hidden) */}
                    <p className="text-center text-2xl font-bold text-[#0A66C2] lg:hidden">
                        Authormity
                    </p>

                    {/* Header */}
                    <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-sm text-muted-foreground">
                            Sign in to continue to Authormity.space
                        </p>
                    </div>

                    {/* LinkedIn primary sign-in */}
                    <Button
                        onClick={handleLinkedInSignIn}
                        className="w-full bg-[#0A66C2] text-white hover:bg-[#004182] active:bg-[#003875] transition-colors"
                        size="lg"
                    >
                        <Linkedin className="mr-2 h-5 w-5" />
                        Continue with LinkedIn
                    </Button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">or</span>
                        </div>
                    </div>

                    {/* Clerk email fallback */}
                    <div className="flex justify-center">
                        <SignIn
                            afterSignInUrl="/dashboard"
                            afterSignUpUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: 'w-full',
                                    card: 'shadow-none border border-border rounded-lg p-4 w-full',
                                    headerTitle: 'hidden',
                                    headerSubtitle: 'hidden',
                                    socialButtonsBlockButton: 'hidden',
                                    dividerRow: 'hidden',
                                    footer: 'hidden',
                                },
                            }}
                        />
                    </div>

                    {/* Terms */}
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
