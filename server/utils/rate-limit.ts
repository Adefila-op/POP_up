/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and DoS on sensitive endpoints
 */

import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { Context } from 'hono';
import { AppError, ERROR_CODES } from './errors';

// Create rate limiters for different endpoints
const authLoginLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 15 * 60, // per 15 minutes
});

const apiGeneralLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

const walletActionLimiter = new RateLimiterMemory({
  points: 20, // 20 transactions
  duration: 60, // per 60 seconds
});

/**
 * Get rate limit key from request context
 * Prefers wallet address, falls back to IP
 */
function getRateLimitKey(c: Context, keyPrefix: string): string {
  const walletAddress = c.req.header('x-wallet-address');
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  
  const key = walletAddress || ip;
  return `${keyPrefix}:${key}`;
}

/**
 * Rate limit middleware for authentication endpoints
 */
export async function rateLimitAuth(c: Context, next: () => Promise<void>): Promise<void> {
  try {
    const key = getRateLimitKey(c, 'auth-login');
    await authLoginLimiter.consume(key);
    await next();
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      const retryAfter = Math.ceil(error.msBeforeNext / 1000);
      c.status(429);
      throw new AppError(
        ERROR_CODES.RATE_LIMITED,
        `Too many login attempts. Retry after ${retryAfter} seconds`,
        429,
        { retryAfter }
      );
    }
    throw error;
  }
}

/**
 * Rate limit middleware for general API endpoints
 */
export async function rateLimitAPI(c: Context, next: () => Promise<void>): Promise<void> {
  try {
    const key = getRateLimitKey(c, 'api');
    await apiGeneralLimiter.consume(key);
    await next();
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      c.status(429);
      throw new AppError(
        ERROR_CODES.RATE_LIMITED,
        'Too many requests. Please slow down.',
        429
      );
    }
    throw error;
  }
}

/**
 * Rate limit middleware for wallet transactions
 */
export async function rateLimitWalletAction(c: Context, next: () => Promise<void>): Promise<void> {
  try {
    const key = getRateLimitKey(c, 'wallet-action');
    await walletActionLimiter.consume(key);
    await next();
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      c.status(429);
      throw new AppError(
        ERROR_CODES.RATE_LIMITED,
        'Too many wallet actions. Please wait before trying again.',
        429
      );
    }
    throw error;
  }
}
