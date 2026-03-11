import { client } from "@/redis/client";
import type { RateLimiterConfig, RateLimiterResult } from "@/types";
import { logger } from "@/utils/logger";
import type { Context, HonoRequest, MiddlewareHandler, Next } from "hono";

const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local maxRequests = tonumber(ARGV[1])
local windowSeconds = tonumber(ARGV[2])

local currentCount = redis.call("INCR", key)
if currentCount == 1 then
  redis.call("EXPIRE", key, windowSeconds)
end

local ttl = redis.call("TTL", key)
if ttl < 0 then
  ttl = windowSeconds
end

local allowed = 0
if currentCount <= maxRequests then
  allowed = 1
end

return { allowed, currentCount, ttl }
`;

export async function rateLimit(
  key: string,
  config: RateLimiterConfig,
): Promise<RateLimiterResult> {
  const redisKey = `ratelimit:${config.identifier}:${key}`;

  try {
    const result = (await client.send("EVAL", [
      RATE_LIMIT_SCRIPT,
      "1",
      redisKey,
      config.maxRequests.toString(),
      config.windowSeconds.toString(),
    ])) as [number, number, number];

    const [allowed, currentCount, ttl] = result;
    const resetIn = Math.max(1, Number(ttl) || config.windowSeconds);

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
      allowed: false,
      current: 0,
      limit: config.maxRequests,
      resetIn: config.windowSeconds,
      remaining: 0,
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
    const identifier = ip;
    const result = await rateLimit(key, { ...config, identifier });

    c.header("X-RateLimit-Limit", result.limit.toString());
    c.header("X-RateLimit-Remaining", result.remaining.toString());
    c.header("X-RateLimit-Reset", result.resetIn.toString());
    c.header("Retry-After", result.resetIn.toString());

    if (!result.allowed) {
      return c.json(
        {
          message: `Too Many Requests. Try again in ${result.resetIn} seconds.`,
        },
        429,
      );
    }

    await next();
  };
}
