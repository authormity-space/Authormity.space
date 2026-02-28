/** Supported billing plan types. */
export type PlanType = 'free' | 'pro' | 'team';

/** Post publication status values. */
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

/**
 * Mirrors the Prisma Profile model.
 * Represents a user profile synced from Clerk.
 */
export interface Profile {
    id: string;
    clerkId: string;
    email: string;
    name: string;
    linkedinId: string | null;
    linkedinToken: string | null;
    linkedinTokenExp: Date | null;
    plan: PlanType;
    voiceProfile: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Mirrors the Prisma Post model.
 * Represents a LinkedIn post managed within the platform.
 */
export interface Post {
    id: string;
    profileId: string;
    content: string;
    status: PostStatus;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    platform: string;
    analytics: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Defines a user's AI writing voice profile.
 * Used to personalise AI-generated content to match the user's style.
 */
export interface VoiceProfile {
    tone: 'professional' | 'conversational' | 'inspirational' | 'educational' | 'bold';
    sentenceLength: 'short' | 'medium' | 'long';
    emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy';
    hookStyle: 'question' | 'statement' | 'statistic' | 'story';
    vocabulary: string[];
    avoids: string[];
    signature: string;
}

/**
 * Generic API response wrapper for all route handlers.
 * @template T - The shape of the data returned on success.
 */
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    success: boolean;
}
