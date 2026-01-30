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

export class DepartmentService implements DS {
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

  async updateDepartmentName(
    values: { name?: string; faculty?: string },
    departmentId: string,
  ) {
    try {
      const [result] = await db
        .update(departments)
        .set({ ...values })
        .where(eq(departments.id, departmentId));

      if (!result || result.affectedRows === 0)
        throw new NotFound("Department does not exist");
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error updating department");
    }
  }

  async getDepartmentById(departmentId: string) {
    try {
      const [department] = await db
        .select()
        .from(departments)
        .where(and(eq(departments.id, departmentId)));
      if (!department) throw new NotFound("Department not found");

      return department;
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Errr finding department");
    }
  }
  async getDepartmentByFaculty(faculty: string) {
    try {
      const [department] = await db
        .select()
        .from(departments)
        .where(and(eq(departments.faculty, faculty)));
      if (!department) throw new NotFound("Department not found");

      return department;
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Errr finding department");
    }
  }

  async getAllDepartments(
    page: number = 1,
    limit: number = 10,
    faculty?: string,
  ) {
    page = page || 1;
    limit = limit || 10;

    const skip = (page - 1) * limit;

    try {
      let allDepartments;
      let count;
      let total;

      if (faculty) {
        [total] = await db
          .select({ count: sql<number>`count(*)` })
          .from(departments)
          .where(eq(departments.faculty, faculty))
          .limit(limit)
          .offset(skip);

        count = total?.count;

        if (!count || count === 0) throw new NotFound("No departments found");

        allDepartments = await db
          .select()
          .from(departments)
          .where(eq(departments.faculty, faculty))
          .limit(limit)
          .offset(skip);

        if (!allDepartments || allDepartments.length === 0)
          throw new NotFound("No departments found");
      } else {
        [total] = await db
          .select({ count: sql<number>`count(*)` })
          .from(departments)
          .limit(limit)
          .offset(skip);

        count = total?.count;

        if (!count || count === 0) throw new NotFound("No departments found");

        allDepartments = await db
          .select()
          .from(departments)
          .limit(limit)
          .offset(skip);

        if (!allDepartments || allDepartments.length === 0)
          throw new NotFound("No departments found");
      }

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
      const [result] = await db.insert(table).values({ ...values });

      if (!result || result.affectedRows !== 1)
        throw new InternalServerError("Insert failed: no rows were inserted");
      return { values };
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
