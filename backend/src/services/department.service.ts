import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/mysql";
import { departments } from "../db/schema/department";
import type {
  NewDepartment,
  Table,
  Values,
  DepartmentService as DS,
} from "../types";
import { BadRequest, InternalServerError, NotFound } from "../utils/error";

export class Department implements DS {
  async createDepartment(payload: NewDepartment) {
    try {
      const { name, faculty } = payload;
      const dept = await this.getDepartmentByName(faculty, name);

      if (dept)
        throw new BadRequest(
          `Department already exists int faculty: ${faculty}`,
        );

      const { values } = await this.insertWithContext(departments, {
        name,
        faculty,
      });

      return values;
    } catch (e) {
      throw new InternalServerError("Error creating new department");
    }
  }

  async updateDepartmentName(name: string, faculty: string) {
    try {
      await db
        .update(departments)
        .set({ name })
        .where(eq(departments.faculty, faculty));
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error updating department");
    }
  }

  async getDepartmentById(departmentId: string, faculty: string) {
    try {
      const [department] = await db
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.faculty, faculty),
            eq(departments.id, departmentId),
          ),
        );
      if (!department) throw new NotFound("Department not found");

      return department;
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Errr finding department");
    }
  }

  async getAllDepartments(faculty: string, page: number, limit: number) {
    page = page || 1;
    limit = limit || 10;

    const skip = (page - 1) * limit;

    try {
      const [total] = await db
        .select({ count: sql<number>`count(*)` })
        .from(departments)
        .where(eq(departments.faculty, faculty))
        .limit(limit)
        .offset(skip);

      const count = total?.count;

      if (!count || count === 0) throw new NotFound("No departments found");

      const allDepartments = await db
        .select()
        .from(departments)
        .where(eq(departments.faculty, faculty))
        .limit(limit)
        .offset(skip);

      if (!allDepartments || allDepartments.length === 0)
        throw new NotFound("No departments found");

      return {
        page,
        totalPages: Math.ceil(count / limit),
        departments: allDepartments,
      };
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error fetching departments");
    }
  }

  async deleteDepartment(departmentId: string) {
    try {
      await db.delete(departments).where(eq(departments.id, departmentId));
    } catch (e) {
      throw new InternalServerError("Error deleting department");
    }
  }

  private async insertWithContext(table: Table, values: Values) {
    try {
      const result = await db.insert(table).values({ ...values });
      return { result, values };
    } catch (err) {
      throw err;
    }
  }

  private async getDepartmentByName(faculty: string, name: string) {
    try {
      const [department] = await db
        .select()
        .from(departments)
        .where(
          and(eq(departments.faculty, faculty), eq(departments.name, name)),
        );
      if (!department) throw new NotFound("Department not found");

      return department;
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Errr finding department");
    }
  }
}
