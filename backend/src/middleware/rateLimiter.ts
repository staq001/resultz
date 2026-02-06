import { client } from "@/redis/client";
import type { RateLimiterConfig, RateLimiterResult } from "@/types";
import { logger } from "@/utils/logger";
import type { Context, HonoRequest, MiddlewareHandler, Next } from "hono";

const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowStart = tonumber(ARGV[2])
local maxRequests = tonumber(ARGV[3])
local windowSeconds = tonumber(ARGV[4])
local requestId = ARGV[5]

redis.call("ZREMRANGEBYSCORE", key, 0, windowStart)
local currentCount = redis.call("ZCARD", key)

local allowed = 0
if currentCount < maxRequests then
  redis.call("ZADD", key, now, requestId)
  allowed = 1
  currentCount = currentCount + 1
end


redis.call("EXPIRE", key, windowSeconds + 1 )


local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
local oldestTimestamp =0
if oldest and oldest[2] then
  oldestTimestamp = tonumber(oldest[2])
end

return { allowed, currentCount, oldestTimestamp }
`;

export async function rateLimit(
  key: string,
  config: RateLimiterConfig,
): Promise<RateLimiterResult> {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const windowStart = now - config.windowSeconds * 1000;
  const redisKey = `ratelimit:${config.identifier}:${key}`;
  const requestId = `${now}-${Math.random().toString(36).substring(2)}`;

  try {
    const result = (await client.send("EVAL", [
      RATE_LIMIT_SCRIPT,
      "1",
      redisKey,
      now.toString(),
      windowStart.toString(),
      config.maxRequests.toString(),
      config.windowSeconds.toString(),
      requestId,
    ])) as [number, number, number];

    const [allowed, currentCount, oldestTimestamp] = result;

    let resetIn = config.windowSeconds;
    if (oldestTimestamp > 0) {
      const oldestExpiry = oldestTimestamp + windowMs;
      resetIn = Math.max(1, Math.ceil((oldestExpiry - now) / 1000));
    }
    return {
      allowed: allowed === 1,
      current: currentCount,
      limit: config.maxRequests,
      resetIn,
      remaining: Math.max(0, config.maxRequests - currentCount),
    };
  } catch (e) {
    logger.error(`Rate limiter error: ${e}`);
    return {
      allowed: true,
      current: 0,
      limit: config.maxRequests,
      resetIn: config.windowSeconds,
      remaining: config.maxRequests,
    };
  }
}

export function getClientIp(request: HonoRequest): string {
  // Cloudflare
  const cfIp = request.header("CF-Connecting-IP");
  if (cfIp) return cfIp;

  // Fly
  const flyIp = request.header("Fly-Client-IP");
  if (flyIp) return flyIp;

  // Vercel / generic proxy
  const realIp = request.header("X-Real-IP");
  if (realIp) return realIp;

  const forwarded = request.header("X-Forwarded-For");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }

  return "unknown";
}

export function createRateLimiterMiddleware(
  key: string,
  config: Omit<RateLimiterConfig, "identifier">,
): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const ip = getClientIp(c.req);
    const identifier = `${ip}:${c.req.path}`;
    const result = await rateLimit(key, { ...config, identifier });

    c.header("X-RateLimit-Limit", result.limit.toString());
    c.header("X-RateLimit-Remaining", result.remaining.toString());
    c.header("X-RateLimit-Reset", result.resetIn.toString());
    c.header("Retry-After", result.resetIn.toString());

    if (!result.allowed) {
      return c.json({ message: "Too Many Requests" }, 429);
    }

    await next();
  };
}
