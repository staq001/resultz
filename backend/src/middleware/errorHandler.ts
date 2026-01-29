import { Hono } from "hono";
import { logger } from "../utils/logger";
import { BadRequest, Conflict, NotFound, Unauthorized } from "../utils/error";

const app = new Hono();

app.onError((err, c) => {
  logger.error(`${err.message}`);

  if (err instanceof BadRequest) return c.json({ message: err.message }, 400);
  if (err instanceof NotFound) return c.json({ message: err.message }, 404);
  if (err instanceof Conflict) return c.json({ message: err.message }, 409);
  if (err instanceof Unauthorized) return c.json({ message: err.message }, 401);

  return c.json({
    status: 500,
    message: err.message || "Internal Server Error",
  });
});

export default app;
