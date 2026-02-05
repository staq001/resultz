import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";

import { RegistrationController } from "@/controllers/registration.controller";
import { registerCourseSchema } from "@/schema/registration.schema";

const { authentication } = new Auth("user");
const app = new Hono();

const {
  registerCourse,
  fetchRegisteredCourse,
  fetchRegisteredCoursesBySemester,
} = new RegistrationController();

app.post(
  "/courses-registrations/register",
  zodValidator(registerCourseSchema),
  authentication,
  registerCourse,
);

app.get(
  "/courses-registrations/:registeredCourseId",
  authentication,
  fetchRegisteredCourse,
);

app.get(
  "/courses-registrations/semester",
  authentication,
  fetchRegisteredCoursesBySemester,
);

export default app;
