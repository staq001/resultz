import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import "@/db/mysql";
import { logger as log } from "@/utils/logger";
import usersRouter from "@/routers/user.router";
import coursesRouter from "@/routers/courses.router";
import scoresRouter from "@/routers/score.router";
import registrationsRouter from "@/routers/registration.router";
import departmentsRouter from "@/routers/departments.router";
import { errorHandler, invalidRoute } from "@/middleware/errorHandler";
import { bodyLimit } from "hono/body-limit";
import { limiter } from "@/middleware/hono-rate-limiter";
import router from "./routers/healthcheck";
import { connectRedis } from "@/redis/client";

const app = new Hono();

app.route("/health", router);
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: [
      "X-Custom-Header",
      "Upgrade-Insecure-Requests",
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Authorization",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  }),
);

app.use(limiter);
app.use(logger());
app.use(
  "*",
  bodyLimit({
    maxSize: 10 * 1024 * 1024,
    onError: (c) => c.text("Payload too large", 413),
  }),
);

app.route("/api/v1", usersRouter);
app.route("/api/v1", coursesRouter);
app.route("/api/v1", scoresRouter);
app.route("/api/v1", registrationsRouter);
app.route("/api/v1", departmentsRouter);

app.get("/", (c) =>
  c.json({ message: "Welcome to the Results Processing API" }, 200),
);

app.all("*", invalidRoute);
errorHandler(app);

const server = Bun.serve({
  fetch: app.fetch,
  port: Number(Bun.env.PORT) || 3000,
});

connectRedis();
log.info(`Server started on http://localhost:${server.port}`);

process.on("SIGTERM", () => {
  log.info("SIGTERM received, shutting down gracefully...");
  server.stop();
});
