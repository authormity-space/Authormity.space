import { ClerkProvider } from '@clerk/nextjs';

/**
 * Standalone layout for all authentication pages (/login etc.).
 * Wraps the subtree with ClerkProvider for auth context.
 * Contains no navbar or footer — auth pages are intentionally minimal.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            {children}
        </ClerkProvider>
    );
}
