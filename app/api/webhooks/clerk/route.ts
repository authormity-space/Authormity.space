import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import { Webhook } from 'svix';
import { prismaClient } from '@/lib/prisma';

/**
 * Handles Clerk webhook events for user lifecycle management.
 * Verifies the request signature using the Svix library before processing.
 * Supported events: user.created, user.updated, user.deleted.
 */
export async function POST(request: Request): Promise<NextResponse> {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('CLERK_WEBHOOK_SECRET is not set.');
        return NextResponse.json({ error: 'Misconfigured server.' }, { status: 500 });
    }

    const headerPayload = headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json({ error: 'Missing Svix headers.' }, { status: 400 });
    }

    const payload = await request.text();
    const wh = new Webhook(webhookSecret);

    let event: WebhookEvent;

    try {
        event = wh.verify(payload, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
    }

    if (event.type === 'user.created') {
        const { id, email_addresses, first_name, last_name } = event.data;
        const email = email_addresses[0]?.email_address ?? '';
        const name = [first_name, last_name].filter(Boolean).join(' ') || 'Unnamed';

        await prismaClient.profile.create({
            data: { clerkId: id, email, name },
        });
    }

    if (event.type === 'user.updated') {
        const { id, email_addresses, first_name, last_name } = event.data;
        const email = email_addresses[0]?.email_address ?? '';
        const name = [first_name, last_name].filter(Boolean).join(' ') || 'Unnamed';

        await prismaClient.profile.update({
            where: { clerkId: id },
            data: { email, name },
        });
    }

    if (event.type === 'user.deleted') {
        const { id } = event.data;
        if (id) {
            await prismaClient.profile.delete({ where: { clerkId: id } });
        }
    }

    return NextResponse.json({ received: true });
}
