import { Hono, type Context } from "hono";
import { logger } from "../utils/logger";
import { BadRequest, Conflict, NotFound, Unauthorized } from "../utils/error";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";

export function errorHandler(app: Hono) {
  return app.onError((err, c) => {
    logger.error(
      `[${c.req.method}] ${c.req.url} - ${err.stack || err.message}`,
    );

    if (err instanceof BadRequest) return c.json({ message: err.message }, 400);
    if (err instanceof HTTPException)
      return c.json({ message: err.message }, err.status);
    if (err instanceof NotFound) return c.json({ message: err.message }, 404);
    if (err instanceof Conflict) return c.json({ message: err.message }, 409);
    if (err instanceof Unauthorized)
      return c.json({ message: err.message }, 401);

    return c.json(
      {
        status: 500,
        message: err.message || "Internal Server Error",
      },
      500,
    );
  });
}

export function invalidRoute(c: Context) {
  const method = c.req.method;
  const url = c.req.url;
  return c.json(
    {
      status: 404,
      message: `Sorry, this route [${method}] ${url} doesn't exist`,
    },
    404,
  );
}

function extractZodErrorMessage(errorMsg: string): string | null {
  try {
    const parsed = JSON.parse(errorMsg);
    if (Array.isArray(parsed) && parsed[0] && parsed[0].message) {
      return parsed[0].message;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function zodValidator(schema: any) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message: "Validation Failed",
          errors: extractZodErrorMessage(result.error.message),
        },
        400,
      );
    }
  });
}
