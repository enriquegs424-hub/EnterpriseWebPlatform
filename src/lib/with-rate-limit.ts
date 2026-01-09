import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, type RateLimiter } from './rate-limit';
import { auth } from '@/auth';

/**
 * Middleware wrapper for rate limiting
 * 
 * Usage:
 * export const GET = withRateLimit(async (request) => {
 *   // Your handler logic
 * });
 */
export function withRateLimit<T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T,
    limiter?: RateLimiter
): T {
    return (async (request: Request, ...args: any[]) => {
        try {
            // Get authenticated user
            const session = await auth();

            // Rate limit check
            const identifier = getClientIdentifier(request, session?.user?.id as string);
            const rateLimit = checkRateLimit(identifier, limiter);

            if (!rateLimit.allowed) {
                return NextResponse.json(
                    {
                        error: 'Too many requests. Please try again later.',
                        retryAfter: Math.ceil((Date.parse(rateLimit.headers['X-RateLimit-Reset']) - Date.now()) / 1000),
                    },
                    {
                        status: 429,
                        headers: rateLimit.headers,
                    }
                );
            }

            // Execute handler
            const response = await handler(request, ...args);

            // Add rate limit headers to successful responses
            if (response instanceof NextResponse) {
                Object.entries(rateLimit.headers).forEach(([key, value]) => {
                    response.headers.set(key, value);
                });
            }

            return response;
        } catch (error) {
            // Let errors bubble up to be handled by the route
            throw error;
        }
    }) as T;
}

/**
 * Check rate limit and return early if exceeded
 * Use this for more granular control
 */
export async function checkAndEnforceRateLimit(
    request: Request,
    limiter?: RateLimiter
): Promise<NextResponse | null> {
    const session = await auth();
    const identifier = getClientIdentifier(request, session?.user?.id as string);
    const rateLimit = checkRateLimit(identifier, limiter);

    if (!rateLimit.allowed) {
        return NextResponse.json(
            {
                error: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil((Date.parse(rateLimit.headers['X-RateLimit-Reset']) - Date.now()) / 1000),
            },
            {
                status: 429,
                headers: rateLimit.headers,
            }
        );
    }

    return null; // No rate limit violation
}
