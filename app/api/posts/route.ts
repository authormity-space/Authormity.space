import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prismaClient } from '@/lib/prisma';

interface CreatePostBody {
    content: string;
}

/**
 * GET /api/posts
 *
 * Returns the authenticated user's last 50 posts ordered by newest first.
 */
export async function GET(): Promise<NextResponse> {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prismaClient.profile.findUnique({
        where: { clerkId: userId },
        select: { id: true },
    });

    if (!profile) {
        return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    const posts = await prismaClient.post.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
            id: true,
            content: true,
            status: true,
            scheduledAt: true,
            publishedAt: true,
            createdAt: true,
        },
    });

    return NextResponse.json({ posts });
}

/**
 * POST /api/posts
 *
 * Saves a manually written post as a draft.
 * Body: { content: string } — must be 1–3000 characters.
 */
export async function POST(request: Request): Promise<NextResponse> {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: CreatePostBody;
    try {
        body = (await request.json()) as CreatePostBody;
    } catch {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length < 1 || content.trim().length > 3000) {
        return NextResponse.json(
            { error: 'Content must be between 1 and 3000 characters.' },
            { status: 400 }
        );
    }

    const profile = await prismaClient.profile.findUnique({
        where: { clerkId: userId },
        select: { id: true },
    });

    if (!profile) {
        return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    const post = await prismaClient.post.create({
        data: {
            profileId: profile.id,
            content: content.trim(),
            status: 'draft',
        },
    });

    return NextResponse.json({ postId: post.id, content: post.content });
}
