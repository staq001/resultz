import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";

import { ScoreController } from "@/controllers/scoreCourses.controller";
import { scoreCourseSchema } from "@/schema/scoreCourses.schema";

const { authentication, adminProtectedRoute } = new Auth();

const app = new Hono();

const {
  scoreCourse,
  updateScore,
  fetchCourseScore,
  getAllScoredCoursesBySemsesterorYear,
  getAllRegisteredCoursesBySpecificUser,
  getAllScoredCoursesBySemsesterorYearAdmin,
} = new ScoreController();

app.post(
  "/scores/input/:registeredCourseId",
  authentication,
  adminProtectedRoute,
  zodValidator(scoreCourseSchema),
  scoreCourse,
);

app.patch(
  "/scores/update/:scoreId",
  authentication,
  adminProtectedRoute,
  zodValidator(scoreCourseSchema),
  updateScore,
);

app.get(
  "/scores/registeredCourses/:userId",
  authentication,
  adminProtectedRoute,
  getAllRegisteredCoursesBySpecificUser,
);

app.get(
  "/scores/semester-or-year",
  authentication,
  getAllScoredCoursesBySemsesterorYear,
);

app.get(
  "/scores/admin/semester-or-year",
  authentication,
  adminProtectedRoute,
  getAllScoredCoursesBySemsesterorYearAdmin,
);

app.get(
  "/scores/:scoreId",
  authentication,
  adminProtectedRoute,
  fetchCourseScore,
);

export default app;
