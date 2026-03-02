import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prismaClient } from '@/lib/prisma';
import { publishPost } from '@/lib/linkedin';
import { checkRateLimit } from '@/lib/ai-rate-limit';

interface PublishBody {
    postId: string;
}

/**
 * POST /api/linkedin/publish
 *
 * Publishes a saved post to LinkedIn on the user's behalf.
 * Verifies ownership, checks if already published, applies rate limiting,
 * calls the LinkedIn UGC Posts API, then updates the post status in Prisma.
 *
 * @returns { success: true, linkedinPostId } on success.
 */
export async function POST(request: Request): Promise<NextResponse> {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: PublishBody;
    try {
        body = (await request.json()) as PublishBody;
    } catch {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { postId } = body;

    if (!postId || typeof postId !== 'string') {
        return NextResponse.json({ error: 'postId is required.' }, { status: 400 });
    }

    // Get profile
    const profile = await prismaClient.profile.findUnique({
        where: { clerkId: userId },
        select: { id: true },
    });

    if (!profile) {
        return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    // Fetch post and verify ownership
    const post = await prismaClient.post.findUnique({
        where: { id: postId },
        select: { id: true, profileId: true, content: true, status: true },
    });

    if (!post) {
        return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    if (post.profileId !== profile.id) {
        return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    if (post.status === 'published') {
        return NextResponse.json({ error: 'Post already published.' }, { status: 400 });
    }

    // Rate limit
    try {
        checkRateLimit(profile.id, 'linkedin_publish');
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Rate limit exceeded.' },
            { status: 429 }
        );
    }

    // Publish to LinkedIn
    let linkedinPostId: string;
    try {
        linkedinPostId = await publishPost(profile.id, post.content);
    } catch (err) {
        console.error('LinkedIn publish error:', err instanceof Error ? err.message : err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to publish. Please try again.' },
            { status: 500 }
        );
    }

    // Update post status in DB
    await prismaClient.post.update({
        where: { id: postId },
        data: { status: 'published', publishedAt: new Date() },
    });

    return NextResponse.json({ success: true, linkedinPostId });
}
