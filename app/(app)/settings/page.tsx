import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prismaClient } from '@/lib/prisma';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLAN_LABELS: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    team: 'Team',
};

const PLAN_COLOURS: Record<string, string> = {
    free: 'bg-zinc-100 text-zinc-700',
    pro: 'bg-blue-100 text-blue-700',
    team: 'bg-purple-100 text-purple-700',
};

/**
 * Settings page for Authormity.space.
 *
 * Server component — fetches the Profile directly from Prisma using the
 * current Clerk session. Shows:
 * - LinkedIn connection status (connected or not) with a connect/disconnect button.
 * - Current billing plan badge.
 */
export default async function SettingsPage() {
    const { userId } = await auth();
    if (!userId) redirect('/login');

    const profile = await prismaClient.profile.findUnique({
        where: { clerkId: userId },
        select: {
            name: true,
            email: true,
            linkedinId: true,
            plan: true,
        },
    });

    const isLinkedInConnected = Boolean(profile?.linkedinId);
    const plan = profile?.plan ?? 'free';
    const planLabel = PLAN_LABELS[plan] ?? plan;
    const planColour = PLAN_COLOURS[plan] ?? PLAN_COLOURS['free'];

    return (
        <div className="max-w-2xl space-y-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your account, connections, and billing plan.
                </p>
            </div>

            {/* Current Plan */}
            <section className="rounded-lg border border-border p-6 space-y-4">
                <h2 className="text-base font-semibold">Billing Plan</h2>
                <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${planColour}`}>
                        {planLabel}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {plan === 'free'
                            ? 'Upgrade to Pro for unlimited posts and AI credits.'
                            : 'Thank you for being a subscriber!'}
                    </span>
                </div>
            </section>

            {/* Connected Accounts */}
            <section className="rounded-lg border border-border p-6 space-y-4">
                <h2 className="text-base font-semibold">Connected Accounts</h2>

                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                        {/* LinkedIn icon */}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A66C2]">
                            <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5 fill-white"
                                aria-hidden="true"
                            >
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </div>

                        <div>
                            <p className="text-sm font-medium leading-none">LinkedIn</p>
                            {isLinkedInConnected ? (
                                <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    Connected
                                </p>
                            ) : (
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <XCircle className="h-3 w-3" />
                                    Not connected
                                </p>
                            )}
                        </div>
                    </div>

                    {isLinkedInConnected ? (
                        <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
                            Active
                        </span>
                    ) : (
                        <Button asChild size="sm" className="bg-[#0A66C2] text-white hover:bg-[#004182]">
                            <Link href="/api/auth/linkedin">Connect LinkedIn</Link>
                        </Button>
                    )}
                </div>
            </section>
        </div>
    );
}
