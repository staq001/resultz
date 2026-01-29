import { client } from "./client";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;
const LOCK_SECONDS = 10 * 60;

export async function recordFailure(
  identifier: string,
  maxAttempts: number = MAX_ATTEMPTS,
  operation: string = "normal",
) {
  const failKey = `login:fail:${identifier}`;
  const lockKey = `login:lock:${identifier}`;

  const attempts = await client.incr(failKey);

  if (operation === "normal") {
    if (attempts === 1) {
      await client.expire(failKey, WINDOW_SECONDS);
    }
  }

  if (attempts >= maxAttempts) {
    await client.set(lockKey, "1", "EX", LOCK_SECONDS);
  }
}

export async function recordSuccess(identifier: string) {
  await client.del(`login:fail:${identifier}`);
  await client.del(`login:lock:${identifier}`);
}

export async function isAccountLocked(identifier: string) {
  const lockKey = `lock:lock:${identifier}`;
  return await client.exists(lockKey);
}
