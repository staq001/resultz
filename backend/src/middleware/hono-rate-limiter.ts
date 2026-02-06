import { rateLimiter } from "hono-rate-limiter";
import { getClientIp } from "./rateLimiter";

export const limiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  keyGenerator(c) {
    return getClientIp(c.req);
  },
  message: {
    message: "Too many requests, please try again later.",
    status: 429,
  },
});
