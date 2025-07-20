import { retrieveWithExpiry, storeWithExpiry } from "@/lib/redis.js";
import { log } from "@/lib/log.js";
import TooManyRequests from "@/errors/TooManyRequests.js";
const rateStore = new Map();
/**
 * Get client IP address from request
 */
function getClientIP(c) {
    const headers = [
        "x-forwarded-for",
        "cf-connecting-ip",
        "x-real-ip",
        "forwarded",
        "x-client-ip",
    ];
    for (const header of headers) {
        const value = c.req.header(header);
        if (value) {
            const ip = value.split(",")[0].trim();
            if (ip)
                return ip;
        }
    }
    return "unknown";
}
/**
 * Get a unique identifier for rate limiting
 * Uses user ID if authenticated, falls back to IP address
 */
function getIdentifier(c) {
    const user = c.get("user");
    if (user?._id)
        return `user:${user._id}`;
    return `ip:${getClientIP(c)}`;
}
/**
 * Rate limiting middleware for API endpoints
 * Uses Redis with in-memory fallback
 *
 * @example withRateLimit(authController.login.bind(authController))
 * @example withRateLimit(authController.login.bind(authController), { limit: 10, windowSecs: 60 })
 */
export function withRateLimit(handler, options = {}) {
    const { limit = 60, windowSecs = 60, getIdentifier: identifierFn = getIdentifier, message = `Rate limit exceeded. Try again in ${windowSecs} seconds.`, } = options;
    return async function (c, next) {
        const identifier = identifierFn(c);
        const path = c.req.path;
        const key = `ratelimit:${path}:${identifier}`;
        try {
            // Get current count from Redis or fallback store
            const currentCount = await retrieveWithExpiry(key, rateStore) ||
                0;
            // Check if already over limit before incrementing
            if (currentCount >= limit) {
                const retryAfter = windowSecs;
                c.header("Retry-After", retryAfter.toString());
                c.header("X-RateLimit-Limit", limit.toString());
                c.header("X-RateLimit-Remaining", "0");
                c.header("X-RateLimit-Reset", Math.floor(Date.now() / 1000 + retryAfter).toString());
                throw new TooManyRequests(message);
            }
            // Increment and store updated count
            const newCount = currentCount + 1;
            await storeWithExpiry(key, newCount, windowSecs, rateStore);
            // Set rate limit headers
            c.header("X-RateLimit-Limit", limit.toString());
            c.header("X-RateLimit-Remaining", Math.max(0, limit - newCount).toString());
            c.header("X-RateLimit-Reset", Math.floor(Date.now() / 1000 + windowSecs).toString());
            // Continue to handler
            return handler(c, next);
        }
        catch (err) {
            if (err instanceof TooManyRequests) {
                log("INFO", `Rate limit exceeded for ${identifier} on ${path}`);
                throw err;
            }
            log("ERROR", `Rate limit check failed: ${err}`);
            return handler(c, next);
        }
    };
}
