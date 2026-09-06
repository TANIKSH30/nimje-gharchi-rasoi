/**
 * Client-side and Edge Action Rate Limiter for Nimje Gharchi Rasoi
 * Prevents abuse of sensitive actions (UTR submissions, contact form, payments).
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetTime: number;
}

const MEMORY_FALLBACK_STORE = new Map<string, number[]>();

export function checkRateLimit(
  actionKey: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const storageKey = `ngr_rl_${actionKey}`;

  let timestamps: number[] = [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      timestamps = JSON.parse(raw);
    }
  } catch {
    timestamps = MEMORY_FALLBACK_STORE.get(storageKey) || [];
  }

  // Filter out timestamps outside the active sliding window
  const windowStart = now - windowMs;
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    const oldestTimestamp = timestamps[0];
    const resetTime = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      resetTime,
    };
  }

  // Record current request timestamp
  timestamps.push(now);

  try {
    localStorage.setItem(storageKey, JSON.stringify(timestamps));
  } catch {
    MEMORY_FALLBACK_STORE.set(storageKey, timestamps);
  }

  return {
    allowed: true,
    remaining: maxRequests - timestamps.length,
    retryAfterSeconds: 0,
    resetTime: now + windowMs,
  };
}

export function enforceRateLimit(
  actionKey: string,
  maxRequests: number = 5,
  windowMs: number = 60000,
  actionName: string = 'Action'
): void {
  const result = checkRateLimit(actionKey, maxRequests, windowMs);
  if (!result.allowed) {
    throw new Error(
      `Rate limit exceeded: Too many ${actionName.toLowerCase()} requests. Please wait ${result.retryAfterSeconds}s before trying again.`
    );
  }
}
