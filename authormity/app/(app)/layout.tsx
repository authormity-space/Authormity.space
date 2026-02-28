'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Create', href: '/create' },
    { label: 'Swipe', href: '/swipe' },
    { label: 'Schedule', href: '/schedule' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Repurpose', href: '/repurpose' },
    { label: 'Engage', href: '/engage' },
    { label: 'Settings', href: '/settings' },
] as const;

/**
 * Top navigation bar used inside the authenticated app layout.
 * Shows the Authormity logo, nav links (desktop), and Clerk UserButton.
 * On mobile, nav links collapse into a hamburger menu.
 */
function Navbar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/dashboard" className="text-xl font-bold text-[#0A66C2]">
                    Authormity
                </Link>

                {/* Desktop nav links */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                pathname === link.href
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right side: UserButton + mobile menu toggle */}
                <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/login" />
                    <button
                        className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-accent"
                        onClick={() => setOpen((prev) => !prev)}
                        aria-label="Toggle navigation menu"
                    >
                        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown menu */}
            {open && (
                <div className="md:hidden border-t border-border/40 bg-background px-4 pb-4">
                    <nav className="mt-2 flex flex-col gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    pathname === link.href
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}

/**
 * Protected layout for all dashboard/app pages.
 * Renders a sticky top navbar with logo, nav links (including Settings), and Clerk UserButton.
 * Routes within this group are protected by middleware.ts.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
        </div>
    );
}
