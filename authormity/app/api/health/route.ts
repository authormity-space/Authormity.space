import { NextResponse } from 'next/server';

/**
 * Health check endpoint.
 * Returns the current status, timestamp, and application version.
 * No authentication is required.
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
}
