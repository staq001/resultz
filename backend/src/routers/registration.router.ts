import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";

import { RegistrationController } from "@/controllers/registration.controller";
import { registerCourseSchema } from "@/schema/registration.schema";

const { authentication } = new Auth();
const app = new Hono();

const {
  registerCourse,
  fetchRegisteredCourse,
  fetchRegisteredCoursesBySemester,
  findCourseByCourseCode,
} = new RegistrationController();

app.post(
  "/courses-registrations/register",
  authentication,
  zodValidator(registerCourseSchema),
  registerCourse,
);

app.get(
  "/courses-registrations/semester",
  authentication,
  fetchRegisteredCoursesBySemester,
);

app.get(
  "/courses-registrations/course",
  authentication,
  findCourseByCourseCode,
);

app.get(
  "/courses-registrations/:registeredCourseId",
  authentication,
  fetchRegisteredCourse,
);

export default app;
