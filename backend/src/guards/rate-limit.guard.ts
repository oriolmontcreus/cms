import { Context, Next } from "hono";
import { retrieveWithExpiry, storeWithExpiry } from "@/lib/redis.js";
import { log } from "@/lib/log.js";
import TooManyRequests from "@/errors/TooManyRequests.js";
import { User } from "@shared/types/user.type.js";

const rateStore = new Map<string, { value: number; expiresAt: number }>();

/**
 * Get client IP address from request
 */
function getClientIP(c: Context): string {
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
      if (ip) return ip;
    }
  }
  return "unknown";
}

/**
 * Get a unique identifier for rate limiting
 * Uses user ID if authenticated, falls back to IP address
 */
function getIdentifier(c: Context): string {
  const user = c.get("user") as User | undefined;
  if (user?._id) return `user:${user._id}`;
  return `ip:${getClientIP(c)}`;
}

interface RateLimitOptions {
  // Maximum number of requests in the time window
  limit?: number;
  // Time window in seconds
  windowSecs?: number;
  // Custom identifier function (defaults to IP)
  getIdentifier?: (c: Context) => string;
  // Message to return when rate limit is exceeded
  message?: string;
}

/**
 * Rate limiting middleware for API endpoints
 * Uses Redis with in-memory fallback
 *
 * @example withRateLimit(authController.login.bind(authController))
 * @example withRateLimit(authController.login.bind(authController), { limit: 10, windowSecs: 60 })
 */
export function withRateLimit(
  handler: Function,
  options: RateLimitOptions = {},
) {
  const {
    limit = 60,
    windowSecs = 60,
    getIdentifier: identifierFn = getIdentifier,
    message = `Rate limit exceeded. Try again in ${windowSecs} seconds.`,
  } = options;

  return async function (c: Context, next?: Next) {
    const identifier = identifierFn(c);
    const path = c.req.path;
    const key = `ratelimit:${path}:${identifier}`;

    try {
      // Get current count from Redis or fallback store
      const currentCount = await retrieveWithExpiry<number>(key, rateStore) ||
        0;

      // Check if already over limit before incrementing
      if (currentCount >= limit) {
        const retryAfter = windowSecs;
        c.header("Retry-After", retryAfter.toString());
        c.header("X-RateLimit-Limit", limit.toString());
        c.header("X-RateLimit-Remaining", "0");
        c.header(
          "X-RateLimit-Reset",
          Math.floor(Date.now() / 1000 + retryAfter).toString(),
        );
        throw new TooManyRequests(message);
      }

      // Increment and store updated count
      const newCount = currentCount + 1;
      await storeWithExpiry(key, newCount, windowSecs, rateStore);

      // Set rate limit headers
      c.header("X-RateLimit-Limit", limit.toString());
      c.header(
        "X-RateLimit-Remaining",
        Math.max(0, limit - newCount).toString(),
      );
      c.header(
        "X-RateLimit-Reset",
        Math.floor(Date.now() / 1000 + windowSecs).toString(),
      );

      // Continue to handler
      return handler(c, next);
    } catch (err) {
      if (err instanceof TooManyRequests) {
        log("INFO", `Rate limit exceeded for ${identifier} on ${path}`);
        throw err;
      }
      log("ERROR", `Rate limit check failed: ${err}`);
      return handler(c, next);
    }
  };
}
