import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";
import { CourseController } from "@/controllers/courses.controller";
import { addCourseSchema, updateCourseSchema } from "@/schema/courses.schema";

const { authentication, adminProtectedRoute } = new Auth();
const app = new Hono();

import { CSVController } from "@/controllers/csv.controller.ts";

const { processCSV } = new CSVController();

const {
  addCourse,
  deleteCourse,
  updateCourse,
  findSpecificCourse,
  getAllCourses,
  getAvailableCoursesForStudent,
} = new CourseController();

app.post(
  "/courses/create/:departmentId",
  authentication,
  adminProtectedRoute,
  zodValidator(addCourseSchema),
  addCourse,
);

app.post("/courses/bulkInput", authentication, adminProtectedRoute, processCSV);

app.delete(
  "/courses/delete/:courseId",
  authentication,
  adminProtectedRoute,
  deleteCourse,
);

app.patch(
  "/courses/update/:courseId",
  authentication,
  adminProtectedRoute,
  zodValidator(updateCourseSchema),
  updateCourse,
);

app.get("/courses/available", authentication, getAvailableCoursesForStudent);

app.get(
  "/courses/:courseId",
  authentication,
  adminProtectedRoute,
  findSpecificCourse,
);

app.get("/courses/department/:departmentId", authentication, getAllCourses);

export default app;
