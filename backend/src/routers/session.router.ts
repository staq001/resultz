import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";
import { SessionController } from "@/controllers/session.controller";
import { addSessionSchema } from "@/schema/session.schema";
const { authentication, adminProtectedRoute } = new Auth();
const app = new Hono();

const { createSession, updateSession, setSession } = new SessionController();

app.post(
  "/sessions/create",
  authentication,
  adminProtectedRoute,
  zodValidator(addSessionSchema),
  createSession,
);

app.put(
  "/sessions/update",
  authentication,
  adminProtectedRoute,
  zodValidator(addSessionSchema),
  updateSession,
);

app.put(
  "/sessions/set",
  authentication,
  adminProtectedRoute,
  zodValidator(addSessionSchema),
  setSession,
);

export default app;
