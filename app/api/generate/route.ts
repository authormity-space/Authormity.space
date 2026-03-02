import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateText } from '@/lib/openrouter';
import { postGeneratorPrompt } from '@/lib/prompts';
import { checkRateLimit } from '@/lib/ai-rate-limit';
import { getVoiceProfile } from '@/lib/voice-profile';
import { prismaClient } from '@/lib/prisma';

interface GenerateRequestBody {
    topic: string;
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    swipeRef?: string;
}

const LENGTH_INSTRUCTIONS: Record<string, string> = {
    short: 'under 150 words',
    medium: '150 to 300 words',
    long: '300 to 600 words',
};

/**
 * POST /api/generate
 *
 * Generates a LinkedIn post using AI for the authenticated user.
 * Applies the user's voice profile, rate limiting, and saves the result as a draft.
 *
 * @returns { postId, content, wordCount } on success.
 */
export async function POST(request: Request): Promise<NextResponse> {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: GenerateRequestBody;
    try {
        body = (await request.json()) as GenerateRequestBody;
    } catch {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { topic, tone, length = 'medium', swipeRef } = body;

    // Validate topic
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3 || topic.trim().length > 500) {
        return NextResponse.json(
            { error: 'Topic must be between 3 and 500 characters.' },
            { status: 400 }
        );
    }

    // Get internal profileId
    const profile = await prismaClient.profile.findUnique({
        where: { clerkId: userId },
        select: { id: true },
    });

    if (!profile) {
        return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    // Rate limit check
    try {
        checkRateLimit(profile.id, 'post_generate');
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Rate limit exceeded.' },
            { status: 429 }
        );
    }

    // Build user prompt
    const lengthInstruction = LENGTH_INSTRUCTIONS[length] ?? LENGTH_INSTRUCTIONS['medium'];
    const promptParts = [
        `Write a LinkedIn post about: ${topic.trim()}`,
        `Length: ${lengthInstruction}`,
    ];
    if (swipeRef?.trim()) {
        promptParts.push(
            `Use this post as a structural reference — same hook type, same pattern, but different content:\n${swipeRef.trim()}`
        );
    }
    if (tone && tone !== 'auto') {
        promptParts.push(`Tone override: ${tone}`);
    }
    const userPrompt = promptParts.join('\n');

    // Get voice profile (may be null — prompt handles both cases)
    const voiceProfile = await getVoiceProfile(profile.id);

    // Generate
    let content: string;
    try {
        content = await generateText({
            prompt: userPrompt,
            systemPrompt: postGeneratorPrompt(voiceProfile),
            temperature: 0.8,
            maxTokens: 800,
        });
    } catch (err) {
        console.error('Post generation error:', err instanceof Error ? err.message : err);
        return NextResponse.json(
            { error: 'Generation failed. Please try again.' },
            { status: 500 }
        );
    }

    // Save as draft
    const post = await prismaClient.post.create({
        data: {
            profileId: profile.id,
            content,
            status: 'draft',
        },
    });

    const wordCount = content.trim().split(/\s+/).length;

    return NextResponse.json({ postId: post.id, content, wordCount });
}
