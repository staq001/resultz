import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";
import { CSVController } from "@/controllers/csv.controller.ts";

import { ScoreController } from "@/controllers/scoreCourses.controller";
import { scoreCourseSchema } from "@/schema/scoreCourses.schema";
import { uploadCSVSchema } from "@/schema/csv.schema";

const { authentication, adminProtectedRoute, staffProtectedRoute } = new Auth();

const app = new Hono();

const { processCSV } = new CSVController();

const {
  scoreCourse,
  updateScore,
  fetchCourseScore,
  getScoresForCourse,
  getComprehensiveReport,
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

app.post(
  "/scores/bulkInput/:semesterId",
  authentication,
  staffProtectedRoute,
  processCSV,
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

app.get("/scores/comprehensive-report", authentication, getComprehensiveReport);

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
