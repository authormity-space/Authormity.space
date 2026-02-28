import { prismaClient } from '@/lib/prisma';
import type { VoiceProfile } from '@/types';

/**
 * Returns a sensible default VoiceProfile for new users who haven't set one yet.
 * Optimised for professional LinkedIn writing — no emojis, direct and clear.
 */
export function buildDefaultVoiceProfile(): VoiceProfile {
    return {
        tone: 'professional',
        sentenceLength: 'short',
        emojiUsage: 'none',
        hookStyle: 'statement',
        vocabulary: ['straightforward', 'practical', 'clear'],
        avoids: ['synergy', 'leverage', 'utilize', 'circle back', 'game-changer'],
        signature:
            'Direct, no-fluff writing that respects the reader\'s time. Clear ideas, strong hooks, zero corporate jargon.',
    };
}

function isValidVoiceProfile(value: unknown): value is VoiceProfile {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v['tone'] === 'string' &&
        typeof v['sentenceLength'] === 'string' &&
        typeof v['emojiUsage'] === 'string' &&
        typeof v['hookStyle'] === 'string' &&
        Array.isArray(v['vocabulary']) &&
        Array.isArray(v['avoids']) &&
        typeof v['signature'] === 'string'
    );
}

/**
 * Fetches the stored VoiceProfile for a given profile ID from Prisma.
 * @param profileId - The Prisma Profile `id` (not clerkId).
 * @returns The user's VoiceProfile, or null if none has been set.
 */
export async function getVoiceProfile(profileId: string): Promise<VoiceProfile | null> {
    const profile = await prismaClient.profile.findUnique({
        where: { id: profileId },
        select: { voiceProfile: true },
    });

    if (!profile?.voiceProfile) return null;

    if (!isValidVoiceProfile(profile.voiceProfile)) {
        console.error('Stored voiceProfile failed validation for profile:', profileId);
        return null;
    }

    return profile.voiceProfile;
}

/**
 * Validates and saves a VoiceProfile to the database for a given profile ID.
 * @param profileId - The Prisma Profile `id` to update.
 * @param voice - The VoiceProfile object to save.
 * @throws A readable error if any required field is missing or invalid.
 */
export async function saveVoiceProfile(
    profileId: string,
    voice: VoiceProfile
): Promise<void> {
    if (!isValidVoiceProfile(voice)) {
        throw new Error(
            'Invalid voice profile. Please ensure all required fields are filled in: ' +
            'tone, sentenceLength, emojiUsage, hookStyle, vocabulary, avoids, signature.'
        );
    }

    await prismaClient.profile.update({
        where: { id: profileId },
        // JSON round-trip strips TypeScript interface typing, producing a plain
        // object that satisfies Prisma's NullableJsonNullValueInput constraint.
        data: { voiceProfile: JSON.parse(JSON.stringify(voice)) },
    });
}
