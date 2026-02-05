import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";
import { CourseController } from "@/controllers/courses.controller";
import { addCourseSchema, updateCourseSchema } from "@/schema/courses.schema";

const { authentication } = new Auth();
const app = new Hono();

const {
  addCourse,
  deleteCourse,
  updateCourse,
  findSpecificCourse,
  getAllCourses,
} = new CourseController();

app.post(
  "/courses/create",
  zodValidator(addCourseSchema),
  authentication,
  addCourse,
);

app.delete("/courses/delete/:courseId", authentication, deleteCourse);

app.patch(
  "/courses/update/:courseId",
  zodValidator(updateCourseSchema),
  authentication,
  updateCourse,
);

app.get("/courses/:courseId", authentication, findSpecificCourse);

app.get("/courses/department/:departmentId", authentication, getAllCourses);

export default app;
