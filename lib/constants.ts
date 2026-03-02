export const APP_NAME = 'Authormity';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://authormity.space';
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const PLANS = {
    free: {
        label: 'Free',
        credits: 10,
        postLimit: 5,
    },
    pro: {
        label: 'Pro',
        credits: 200,
        postLimit: -1,
    },
    team: {
        label: 'Team',
        credits: 1000,
        postLimit: -1,
    },
} as const;

export const POST_STATUSES = ['draft', 'scheduled', 'published', 'failed'] as const;

export const VOICE_TONES = [
    'professional',
    'conversational',
    'inspirational',
    'educational',
    'bold',
] as const;

export const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Create', href: '/create' },
    { label: 'Swipe', href: '/swipe' },
    { label: 'Viral', href: '/viral' },
    { label: 'Carousel', href: '/carousel' },
    { label: 'Schedule', href: '/schedule' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Repurpose', href: '/repurpose' },
    { label: 'Engage', href: '/engage' },
] as const;
