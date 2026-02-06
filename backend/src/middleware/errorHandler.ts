import { Hono, type Context } from "hono";
import { logger } from "../utils/logger";
import { BadRequest, Conflict, NotFound, Unauthorized } from "../utils/error";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";

export function errorHandler(app: Hono) {
  return app.onError((err, c) => {
    logger.error(`${err.message}`);

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
  const { url, method, header } = c.req;

  const protocol = header("X-Forwarded-Proto") || "http";
  const host = c.get("host");

  return c.json(
    {
      status: 404,
      message: `Sorry, this route ${method}/ ${protocol}://${host}${url} doesn't exist`,
    },
    404,
  );
}

export function zodValidator(schema: any) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message: "Validation Failed",
          errors: result.error.message,
        },
        400,
      );
    }
  });
}
