import { describe, it, expect, beforeEach, vi } from "bun:test";
import { dbMock } from "../helpers/dbMock";

vi.mock("../../src/db/mysql", () => ({ db: dbMock }));

import { DepartmentService } from "../../src/services/department.service";
import { NotFound, BadRequest } from "../../src/utils/error";

describe("DepartmentService", () => {
  beforeEach(() => {
    dbMock.__clear();
  });

  it("createDepartment - success when department absent", async () => {
    const svc = new DepartmentService();

    // no existing department
    dbMock.__pushSelectResult([]);

    const payload = { name: "Math", faculty: "Science" } as any;

    const res = await svc.createDepartment(payload);
    expect(res).toEqual(payload);
  });

  it("createDepartment - throws when department already exists", async () => {
    const svc = new DepartmentService();
    dbMock.__pushSelectResult([{ id: "d1", name: "Math", faculty: "Science" }]);

    await expect(
      svc.createDepartment({ name: "Math", faculty: "Science" } as any),
    ).rejects.toThrow(BadRequest);
  });

  it("updateDepartmentName - throws NotFound when update affectedRows 0", async () => {
    const svc = new DepartmentService();

    // simulate db.update returning affectedRows 0
    const oldUpdate = dbMock.update;
    dbMock.update = (...args: any) => {
      const b: any = oldUpdate(...args);
      b.then = (resolve: any, _reject: any) =>
        Promise.resolve([{ affectedRows: 0 }]).then(resolve);
      return b;
    };

    await expect(
      svc.updateDepartmentName({ name: "New" }, "id1"),
    ).rejects.toThrow(NotFound);

    // restore
    dbMock.update = oldUpdate;
  });

  it("getDepartmentById - returns department when found", async () => {
    const svc = new DepartmentService();
    dbMock.__pushSelectResult([{ id: "d1", name: "Math" }]);

    const dept = await svc.getDepartmentById("d1");
    expect(dept.name).toBe("Math");
  });

  it("getDepartmentById - throws NotFound when missing", async () => {
    const svc = new DepartmentService();
    dbMock.__pushSelectResult([]);
    await expect(svc.getDepartmentById("nope")).rejects.toThrow(NotFound);
  });

  it("getAllDepartments - returns paged results", async () => {
    const svc = new DepartmentService();
    // first select, total count
    dbMock.__pushSelectResult([{ count: 2 }]);
    // second select,  departments list
    dbMock.__pushSelectResult([{ id: "d1" }, { id: "d2" }]);

    const result = await svc.getAllDepartments(1, 10);
    expect(result.page).toBe(1);
    expect(result.departments.length).toBe(2);
  });

  it("getDepartmentNames - returns name list", async () => {
    const svc = new DepartmentService();
    dbMock.__pushSelectResult([{ name: "Math" }, { name: "Physics" }]);
    const names = await svc.getDepartmentNames();
    expect(names.length).toBe(2);
  });

  it("deleteDepartment - executes without throwing", async () => {
    const svc = new DepartmentService();
    await expect(svc.deleteDepartment("d1")).resolves.toBeUndefined();
  });
});
