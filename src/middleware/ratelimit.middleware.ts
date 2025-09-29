/**
 * Middleware de rate limiting
 */

import { checkRateLimit, getRateLimitInfo } from '../ratelimit';

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetTime?: Date;
}

export async function checkUserRateLimit(email: string): Promise<RateLimitResult> {
  const isAllowed = checkRateLimit(email);

  if (!isAllowed) {
    const rateLimitInfo = getRateLimitInfo(email);
    return {
      allowed: false,
      remaining: rateLimitInfo.remaining,
      resetTime: new Date(rateLimitInfo.resetAt)
    };
  }

  return { allowed: true };
}