import { createClient } from 'redis';
import { log } from "@/lib/log.js";
// Initialize Redis client
let redisClient = null;
let useInMemoryFallback = false;
let redisConnectionAttempted = false;
/**
 * Get or initialize Redis client with smart connection strategy
 * Tries multiple connection methods before falling back to null
 */
export async function getRedisClient() {
    // Return existing client if connected
    if (redisClient)
        return redisClient;
    // Return null if we've already tried and failed
    if (useInMemoryFallback || redisConnectionAttempted)
        return null;
    redisConnectionAttempted = true;
    // Try different connection strategies in order of preference
    const connectionOptions = [
        { name: "127.0.0.1", hostname: "127.0.0.1", port: 6379 },
        { name: "Docker container name", hostname: "orbitasredis", port: 6379 },
        { name: "Docker IP", hostname: "172.18.0.3", port: 6379 },
        { name: "localhost", hostname: "localhost", port: 6379 },
    ];
    // Try each connection option until one works
    for (const option of connectionOptions) {
        try {
            log('INFO', `Attempting Redis connection to ${option.name}...`);
            // Create new client
            redisClient = createClient({
                url: `redis://${option.hostname}:${option.port}`
            });
            // Set up error handler
            redisClient.on('error', (err) => {
                log('ERROR', `Redis client error: ${err}`);
                redisClient = null;
            });
            // Try connecting with 2 second timeout
            await Promise.race([
                redisClient.connect(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 2000))
            ]);
            log('INFO', `Redis connected successfully`);
            return redisClient;
        }
        catch (err) {
            if (redisClient) {
                await redisClient.quit().catch(() => { });
                redisClient = null;
            }
            // Continue to the next option
        }
    }
    // If we get here, all connection attempts failed
    log('WARN', 'All Redis connection attempts failed, using in-memory fallback');
    useInMemoryFallback = true;
    return null;
}
/**
 * Perform health check to verify Redis connection
 * @returns true if Redis is connected and working, false otherwise
 */
export async function checkRedisHealth() {
    try {
        const redis = await getRedisClient();
        if (!redis)
            return false;
        // Try a simple PING command
        const result = await redis.ping();
        return result === 'PONG';
    }
    catch (err) {
        log('ERROR', `Redis health check failed: ${err}`);
        return false;
    }
}
/**
 * Store a value in Redis with expiration
 * Falls back to the provided Map if Redis is unavailable
 */
export async function storeWithExpiry(key, value, expirySeconds, fallbackMap) {
    const redis = await getRedisClient();
    if (redis) {
        await redis.set(key, JSON.stringify(value), { EX: expirySeconds });
    }
    else {
        fallbackMap.set(key, {
            value,
            expiresAt: Date.now() + expirySeconds * 1000
        });
    }
}
/**
 * Retrieve a value from Redis
 * Falls back to the provided Map if Redis is unavailable
 */
export async function retrieveWithExpiry(key, fallbackMap) {
    const redis = await getRedisClient();
    if (redis) {
        const value = await redis.get(key);
        if (!value)
            return null;
        return JSON.parse(value);
    }
    else {
        const entry = fallbackMap.get(key);
        if (!entry)
            return null;
        // Check expiration for in-memory fallback
        if (entry.expiresAt < Date.now()) {
            fallbackMap.delete(key);
            return null;
        }
        return entry.value;
    }
}
/**
 * Delete a value from Redis or fallback Map
 */
export async function deleteKey(key, fallbackMap) {
    const redis = await getRedisClient();
    if (redis) {
        await redis.del(key);
    }
    else {
        fallbackMap.delete(key);
    }
}
