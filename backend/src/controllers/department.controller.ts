import type { Context } from "hono";
import { DepartmentService } from "../services/department.service";
import type {
  CreateDepartmentContext,
  UpdateDepartmentContext,
} from "../types";
import { BadRequest } from "../utils/error";

export class DepartmentController {
  private departmentService;

  constructor() {
    this.departmentService = new DepartmentService();
  }

  createDepartment = async (c: CreateDepartmentContext) => {
    const { name, faculty } = c.req.valid("json");

    try {
      const department = await this.departmentService.createDepartment({
        name,
        faculty,
      });

      c.json(
        {
          status: 201,
          message: "Department created successfully",
          data: { department },
        },
        201,
      );
    } catch (e: any) {
      return c.json({ message: e.message }, e.status || 500);
    }
  };

  updateDepartment = async (c: UpdateDepartmentContext) => {
    const values = c.req.valid("json");
    const departmentId = c.req.param("departmentId");

    try {
      await this.departmentService.updateDepartmentName(values, departmentId);

      c.json({ status: 200, message: "Department updated successfully!" }, 200);
    } catch (e: any) {
      return c.json({ message: e.message }, e.status || 500);
    }
  };

  getDepartment = async (c: Context) => {
    const departmentId = c.req.param("departmentId");

    try {
      const department =
        await this.departmentService.getDepartmentById(departmentId);

      c.json(
        {
          status: 200,
          message: "Department updated successfully!",
          data: { department },
        },
        200,
      );
    } catch (e: any) {
      return c.json({ message: e.message }, e.status || 500);
    }
  };

  getDepartmentByFaculty = async (c: Context) => {
    const faculty = c.req.query("faculty");

    if (faculty)
      throw new BadRequest("Please include faculty name in request query.");
    try {
      const department = await this.departmentService.getDepartmentByFaculty(
        faculty as string,
      );

      c.json(
        {
          status: 200,
          message: "Department fetched successfully!",
          data: { department },
        },
        200,
      );
    } catch (e: any) {
      return c.json({ message: e.message }, e.status || 500);
    }
  };

  getAllDepartments = async (c: Context) => {
    const { faculty, limit, page } = c.req.query();

    try {
      const departments = await this.departmentService.getAllDepartments(
        Number(page),
        Number(limit),
        faculty,
      );

      c.json(
        {
          status: 200,
          message: "Departments fetched successfully!",
          data: { departments },
        },
        200,
      );
    } catch (e: any) {
      return c.json({ message: e.message }, e.status || 500);
    }
  };

  deleteDepartment = async (c: Context) => {
    const departmentId = c.req.param("departmentId");

    try {
      const department =
        await this.departmentService.deleteDepartment(departmentId);
      c.json(
        {
          status: 200,
          message: "Department deleted successfully!",
          data: { department },
        },
        200,
      );
    } catch (e: any) {
      return c.json({ message: e.message }, e.status || 500);
    }
  };
}
