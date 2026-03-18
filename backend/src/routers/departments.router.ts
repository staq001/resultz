import { Hono } from "hono";
import { zodValidator } from "@/middleware/errorHandler";
import { Auth } from "@/middleware/auth";
import { DepartmentController } from "@/controllers/department.controller";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@/schema/department.schema";

const { authentication, adminProtectedRoute, adminOrStaffProtectedRoute } =
  new Auth();
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
  authentication,
  adminProtectedRoute,
  zodValidator(createDepartmentSchema),
  createDepartment,
);

app.put(
  "/departments/update/:departmentId",
  authentication,
  adminProtectedRoute,
  zodValidator(updateDepartmentSchema),
  updateDepartment,
);

app.get(
  "/departments/:departmentId",
  authentication,
  adminProtectedRoute,
  getDepartment,
);

app.get(
  "/departments/faculty",
  authentication,
  adminProtectedRoute,
  getDepartmentByFaculty,
);

app.get(
  "/departments",
  authentication,
  adminOrStaffProtectedRoute,
  getAllDepartments,
);

app.delete(
  "/departments/:departmentId",
  authentication,
  adminProtectedRoute,
  deleteDepartment,
);

export default app;
