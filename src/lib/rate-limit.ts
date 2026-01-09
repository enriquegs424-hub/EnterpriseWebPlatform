/**
 * Rate Limiter
 * 
 * Simple in-memory rate limiter for API protection
 * For production, consider using Redis with @upstash/ratelimit
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    private requests: Map<string, RateLimitEntry> = new Map();
    private readonly maxRequests: number;
    private readonly windowMs: number;

    constructor(maxRequests: number = 100, windowMs: number = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;

        // Cleanup old entries every minute
        setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Check if request is allowed
     * @param identifier - IP address or user ID
     * @returns { allowed: boolean, remaining: number, resetTime: number }
     */
    check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
        const now = Date.now();
        const entry = this.requests.get(identifier);

        if (!entry || entry.resetTime < now) {
            // First request or window expired
            const resetTime = now + this.windowMs;
            this.requests.set(identifier, { count: 1, resetTime });
            return {
                allowed: true,
                remaining: this.maxRequests - 1,
                resetTime,
            };
        }

        if (entry.count >= this.maxRequests) {
            // Rate limit exceeded
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
            };
        }

        // Increment count
        entry.count++;
        this.requests.set(identifier, entry);

        return {
            allowed: true,
            remaining: this.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Reset rate limit for identifier
     */
    reset(identifier: string): void {
        this.requests.delete(identifier);
    }

    /**
     * Cleanup expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.requests.entries()) {
            if (entry.resetTime < now) {
                this.requests.delete(key);
            }
        }
    }

    /**
     * Get current stats for identifier
     */
    getStats(identifier: string): { count: number; resetTime: number } | null {
        const entry = this.requests.get(identifier);
        if (!entry) return null;
        return { count: entry.count, resetTime: entry.resetTime };
    }
}

// Singleton instances for different rate limits
export const apiLimiter = new RateLimiter(100, 60000); // 100 req/min for general APIs
export const authLimiter = new RateLimiter(5, 300000); // 5 req/5min for auth endpoints
export const uploadLimiter = new RateLimiter(10, 60000); // 10 req/min for uploads

/**
 * Helper to get client identifier (IP or userId)
 */
export function getClientIdentifier(request: Request, userId?: string): string {
    if (userId) return `user:${userId}`;

    // Get IP from headers (works with proxies)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    return `ip:${ip}`;
}

/**
 * Rate limit check with automatic headers
 */
export function checkRateLimit(
    identifier: string,
    limiter: RateLimiter = apiLimiter
): {
    allowed: boolean;
    headers: Record<string, string>;
    remaining: number;
} {
    const result = limiter.check(identifier);

    return {
        allowed: result.allowed,
        remaining: result.remaining,
        headers: {
            'X-RateLimit-Limit': limiter['maxRequests'].toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        },
    };
}
