import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";
import { SessionController } from "@/controllers/session.controller";
import { addSessionSchema } from "@/schema/session.schema";
const { authentication, adminProtectedRoute, adminOrStaffProtectedRoute } =
  new Auth();
const app = new Hono();

const {
  createSession,
  updateSession,
  setSession,
  getCurrentSession,
  getSessions,
} = new SessionController();

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

app.get("/sessions/current", authentication, getCurrentSession);

app.get("/sessions", authentication, adminProtectedRoute, getSessions);

export default app;
