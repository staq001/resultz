import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";
import { CourseController } from "@/controllers/courses.controller";
import { addCourseSchema, updateCourseSchema } from "@/schema/courses.schema";

const { authentication, adminProtectedRoute } = new Auth();
const app = new Hono();

const {
  addCourse,
  deleteCourse,
  updateCourse,
  findSpecificCourse,
  getAllCourses,
} = new CourseController();

app.post(
  "/courses/create/:departmentId",
  zodValidator(addCourseSchema),
  authentication,
  adminProtectedRoute,
  addCourse,
);

app.delete(
  "/courses/delete/:courseId",
  authentication,
  adminProtectedRoute,
  deleteCourse,
);

app.patch(
  "/courses/update/:courseId",
  zodValidator(updateCourseSchema),
  authentication,
  adminProtectedRoute,
  updateCourse,
);

app.get(
  "/courses/:courseId",
  authentication,
  adminProtectedRoute,
  findSpecificCourse,
);

app.get(
  "/courses/department/:departmentId",
  authentication,
  adminProtectedRoute,
  getAllCourses,
);

export default app;
