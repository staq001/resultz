import { db } from "@/db/mysql";
import { logger } from "@/utils/logger";
import { Hono } from "hono";

const router = new Hono();

router.get(async (c) => {
  try {
    await db.execute("SELECT 1");
    return c.json({ status: "OK" }, 200);
  } catch (e: any) {
    logger.error(`Health check failed: ${e.message}`);
    return c.json({ status: "error", message: "Service unavailable" }, 503);
  }
});

export default router;
