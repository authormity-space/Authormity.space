import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prismaClient } from '@/lib/prisma';

interface RouteParams {
    params: { id: string };
}

interface PatchBody {
    content?: string;
    status?: string;
}

async function getOwnedPost(postId: string, userId: string) {
    const profile = await prismaClient.profile.findUnique({
        where: { clerkId: userId },
        select: { id: true },
    });

    if (!profile) return { post: null, profileId: null, error: 'not_found' as const };

    const post = await prismaClient.post.findUnique({
        where: { id: postId },
    });

    if (!post) return { post: null, profileId: profile.id, error: 'not_found' as const };
    if (post.profileId !== profile.id) return { post: null, profileId: profile.id, error: 'forbidden' as const };

    return { post, profileId: profile.id, error: null };
}

/**
 * GET /api/posts/[id]
 *
 * Returns a single post owned by the authenticated user.
 * Returns 403 (not 404) if the post exists but belongs to another user
 * to prevent resource enumeration attacks.
 */
export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { post, error } = await getOwnedPost(params.id, userId);

    if (error === 'forbidden') return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    if (error === 'not_found' || !post) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    return NextResponse.json({ post });
}

/**
 * PATCH /api/posts/[id]
 *
 * Updates the content and/or status of a post owned by the authenticated user.
 * Content max 3000 characters.
 */
export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { post, error } = await getOwnedPost(params.id, userId);

    if (error === 'forbidden') return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    if (error === 'not_found' || !post) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    let body: PatchBody;
    try {
        body = (await request.json()) as PatchBody;
    } catch {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { content, status } = body;

    if (content !== undefined && (typeof content !== 'string' || content.length > 3000)) {
        return NextResponse.json({ error: 'Content must be under 3000 characters.' }, { status: 400 });
    }

    const updated = await prismaClient.post.update({
        where: { id: params.id },
        data: {
            ...(content !== undefined && { content }),
            ...(status !== undefined && { status }),
        },
    });

    return NextResponse.json({ post: updated });
}

/**
 * DELETE /api/posts/[id]
 *
 * Permanently deletes a post owned by the authenticated user.
 */
export async function DELETE(request: Request, { params }: RouteParams): Promise<NextResponse> {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { post, error } = await getOwnedPost(params.id, userId);

    if (error === 'forbidden') return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    if (error === 'not_found' || !post) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    await prismaClient.post.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
}
