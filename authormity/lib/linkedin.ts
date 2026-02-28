import { prismaClient } from '@/lib/prisma';
import { decryptToken } from '@/lib/encryption';

interface LinkedInUserInfo {
    sub: string;
    name: string;
    email: string;
    picture?: string;
}

interface UgcPostBody {
    author: string;
    lifecycleState: string;
    specificContent: {
        'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: string };
            shareMediaCategory: string;
        };
    };
    visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': string;
    };
}

interface UgcPostResponse {
    id: string;
}

/**
 * Retrieves and decrypts the LinkedIn access token for a given profile.
 * Throws if the token is missing or expired so callers can prompt reconnection.
 * @param profileId - The Prisma Profile `id` (not clerkId).
 * @returns The decrypted LinkedIn access token string.
 * @throws If the token is missing, expired, or decryption fails.
 */
export async function getDecryptedToken(profileId: string): Promise<string> {
    const profile = await prismaClient.profile.findUnique({
        where: { id: profileId },
        select: { linkedinToken: true, linkedinTokenExp: true },
    });

    if (!profile?.linkedinToken) {
        throw new Error('LinkedIn account not connected. Please connect your account in Settings.');
    }

    if (profile.linkedinTokenExp && profile.linkedinTokenExp < new Date()) {
        throw new Error('LinkedIn token expired. Please reconnect your account in Settings.');
    }

    return decryptToken(profile.linkedinToken);
}

/**
 * Fetches the authenticated user's LinkedIn profile from the OpenID userinfo endpoint.
 * @param accessToken - A valid LinkedIn access token.
 * @returns An object with linkedinId, name, email, and optional picture URL.
 * @throws A readable error if the request fails.
 */
export async function getUserProfile(accessToken: string): Promise<{
    linkedinId: string;
    name: string;
    email: string;
    picture: string | null;
}> {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
        throw new Error(`LinkedIn userinfo request failed with status ${res.status}.`);
    }

    const data = (await res.json()) as LinkedInUserInfo;

    return {
        linkedinId: data.sub,
        name: data.name,
        email: data.email,
        picture: data.picture ?? null,
    };
}

/**
 * Publishes a text post to LinkedIn on behalf of a profile.
 * Fetches and decrypts the stored access token automatically.
 * @param profileId - The Prisma Profile `id` of the user publishing.
 * @param content - The text content to publish as a LinkedIn post.
 * @returns The LinkedIn post ID (URN) of the newly created post.
 * @throws A readable error if publishing fails at any step.
 */
export async function publishPost(profileId: string, content: string): Promise<string> {
    const profile = await prismaClient.profile.findUnique({
        where: { id: profileId },
        select: { linkedinId: true },
    });

    if (!profile?.linkedinId) {
        throw new Error('LinkedIn account not connected. Please connect your account in Settings.');
    }

    const accessToken = await getDecryptedToken(profileId);

    const body: UgcPostBody = {
        author: `urn:li:person:${profile.linkedinId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
            'com.linkedin.ugc.ShareContent': {
                shareCommentary: { text: content },
                shareMediaCategory: 'NONE',
            },
        },
        visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
    };

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LinkedIn publish failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as UgcPostResponse;
    return data.id;
}
