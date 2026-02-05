import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";

import { ScoreController } from "@/controllers/scoreCourses.controller";
import { scoreCourseSchema } from "@/schema/scoreCourses.schema";

const { authentication } = new Auth("user");
const auth = new Auth();

const app = new Hono();

const {
  scoreCourse,
  updateScore,
  fetchCourseScore,
  getAllScoredCoursesBySemsesterorYear,
} = new ScoreController();

app.post(
  "/scores/input",
  zodValidator(scoreCourseSchema),
  auth.authentication,
  scoreCourse,
);

app.patch(
  "/scores/update/:scoreId",
  zodValidator(scoreCourseSchema),
  auth.authentication,
  updateScore,
);

app.get("/scores/:scoreId", auth.authentication, fetchCourseScore);

app.get(
  "/scores/semester-or-year",
  authentication,
  getAllScoredCoursesBySemsesterorYear,
);

export default app;
