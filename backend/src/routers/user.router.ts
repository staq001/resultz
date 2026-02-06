import { Hono } from "hono";
import { UserController } from "@/controllers/user.controller";
import {
  loginSchema,
  signupSchema,
  updatePasswordSchema,
  updateSchema,
} from "@/schema/user.schema";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";

const { authentication } = new Auth("user");
const app = new Hono();

const userController = new UserController();

import { createRateLimiterMiddleware } from "@/middleware/rateLimiter";

app.post(
  "/users/signup",
  createRateLimiterMiddleware("user-signup", {
    windowSeconds: 60,
    maxRequests: 5,
  }),
  zodValidator(signupSchema),
  userController.signup,
);

app.post(
  "/users/login",
  createRateLimiterMiddleware("user-login", {
    windowSeconds: 60,
    maxRequests: 5,
  }),
  zodValidator(loginSchema),
  userController.login,
);

app.post("/users/logout", authentication, userController.logout);

app.post("/users/otp/create/:userId", userController.createOtp);

app.post("/users/otp/verify/:userId", userController.verifyOtp);

app.get("/users/profile", authentication, userController.getUser);

app.patch(
  "/users/update/name",
  zodValidator(updateSchema),
  authentication,
  userController.updateUserName,
);

app.patch(
  "/users/update/password",
  zodValidator(updatePasswordSchema),
  authentication,
  userController.updateUserPassword,
);

app.post("/users/avatar", authentication, userController.uploadAvatar);

app.post("/users/delete", authentication, userController.deleteUser);

app.get("/activate", userController.verifyActivationToken);

export default app;
