import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter } from "../src/lib/rate-limit";

describe("Rate Limiter - Auth Protection", () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        // Create new limiter: 5 attempts, 15min window
        limiter = new RateLimiter(5, 900000);
    });

    it("should allow first 5 attempts", () => {
        const identifier = "auth:test@example.com";

        for (let i = 0; i < 5; i++) {
            const result = limiter.check(identifier);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4 - i);
        }
    });

    it("should block after 5 attempts", () => {
        const identifier = "auth:test@example.com";

        // Use up 5 attempts
        for (let i = 0; i < 5; i++) {
            limiter.check(identifier);
        }

        // 6th attempt should be blocked
        const result = limiter.check(identifier);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it("should reset rate limit after calling reset()", () => {
        const identifier = "auth:success@example.com";

        // Use 3 attempts
        limiter.check(identifier);
        limiter.check(identifier);
        limiter.check(identifier);

        // Reset (simulating successful login)
        limiter.reset(identifier);

        // Should have 5 attempts again
        const result = limiter.check(identifier);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });

    it("should track different identifiers independently", () => {
        const email1 = "auth:user1@example.com";
        const email2 = "auth:user2@example.com";

        // Use 3 attempts for user1
        limiter.check(email1);
        limiter.check(email1);
        limiter.check(email1);

        // user2 should still have 5 attempts
        const result = limiter.check(email2);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);

        // user1 should have 2 remaining
        const result1 = limiter.check(email1);
        expect(result.remaining).toBe(1);
    });

    it("should provide resetTime in future", () => {
        const identifier = "auth:test@example.com";
        const before = Date.now();

        const result = limiter.check(identifier);
        const after = Date.now();

        expect(result.resetTime).toBeGreaterThan(after);
        expect(result.resetTime).toBeLessThanOrEqual(after + 900000); // Within 15min
    });
});

describe("Rate Limiter - Integration Scenario", () => {
    it("should simulate brute force attack and block", () => {
        const limiter = new RateLimiter(5, 900000);
        const attacker = "auth:attacker@example.com";

        // Simulate 10 failed login attempts
        const results = [];
        for (let i = 0; i < 10; i++) {
            results.push(limiter.check(attacker));
        }

        // First 5 should be allowed
        expect(results.slice(0, 5).every(r => r.allowed)).toBe(true);

        // Remaining should be blocked
        expect(results.slice(5).every(r => !r.allowed)).toBe(true);

        // All blocked attempts should have 0 remaining
        expect(results.slice(5).every(r => r.remaining === 0)).toBe(true);
    });

    it("should simulate successful login flow", () => {
        const limiter = new RateLimiter(5, 900000);
        const user = "auth:legitimate@example.com";

        // Failed attempt 1
        let result = limiter.check(user);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);

        // Failed attempt 2
        result = limiter.check(user);
        expect(result.remaining).toBe(3);

        // Successful login - reset
        limiter.reset(user);

        // Next attempt should have full quota
        result = limiter.check(user);
        expect(result.remaining).toBe(4);
    });
});
