import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";

import { ScoreController } from "@/controllers/scoreCourses.controller";
import { scoreCourseSchema } from "@/schema/scoreCourses.schema";

const { authentication, adminProtectedRoute, staffProtectedRoute } = new Auth();

const app = new Hono();

const {
  scoreCourse,
  updateScore,
  fetchCourseScore,
  getScoresForCourse,
  getAllScoredCoursesBySemsester,
  getAllRegisteredCoursesBySpecificUser,
} = new ScoreController();

app.post(
  "/scores/input/:registeredCourseId/:semesterId",
  authentication,
  staffProtectedRoute,
  zodValidator(scoreCourseSchema),
  scoreCourse,
);

app.patch(
  "/scores/update/:registeredCourseId/:semesterId",
  authentication,
  staffProtectedRoute,
  zodValidator(scoreCourseSchema),
  updateScore,
);

app.get(
  "/scores/registeredCourses/:userId",
  authentication,
  adminProtectedRoute,
  getAllRegisteredCoursesBySpecificUser,
);

app.get("/scores/semester", authentication, getAllScoredCoursesBySemsester);

app.get(
  "/scores/course/:courseCode",
  authentication,
  staffProtectedRoute,
  getScoresForCourse,
);

app.get(
  "/scores/:scoreId",
  authentication,
  staffProtectedRoute,
  fetchCourseScore,
);

export default app;
