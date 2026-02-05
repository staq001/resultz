import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";
import { DepartmentController } from "@/controllers/department.controller";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@/schema/department.schema";

const { authentication } = new Auth();
const app = new Hono();

const {
  createDepartment,
  updateDepartment,
  getDepartment,
  getAllDepartments,
  getDepartmentByFaculty,
  deleteDepartment,
} = new DepartmentController();

app.post(
  "/departments/create",
  zodValidator(createDepartmentSchema),
  authentication,
  createDepartment,
);

app.put(
  "/departments/update/:departmentId",
  zodValidator(updateDepartmentSchema),
  authentication,
  updateDepartment,
);

app.get("/departments/:departmentId", authentication, getDepartment);

app.get("/departments/faculty", authentication, getDepartmentByFaculty);

app.get("/departments", authentication, getAllDepartments);

app.delete("/departments/:departmentId", authentication, deleteDepartment);

export default app;
