import { describe, it, expect, beforeEach, vi } from "bun:test";
import { dbMock } from "../helpers/dbMock";

vi.mock("../../src/db/mysql", () => ({ db: dbMock }));

import { SessionService } from "../../src/services/session.service";
import { NotFound, BadRequest, Conflict } from "../../src/utils/error";

describe("SessionService", () => {
  beforeEach(() => dbMock.__clear());

  it("updateSession returns early when names are equal", async () => {
    const svc = new SessionService();
    const res = await svc.updateSession("2022/2023", "2022/2023");
    expect(res).toBeUndefined();
  });

  it("createSession throws when session exists", async () => {
    const svc = new SessionService();
    dbMock.__pushSelectResult([{ id: "s1", schoolSession: "2022/2023" }]);
    await expect(svc.createSession("2022/2023")).rejects.toThrow(Conflict);
  });

  it("getCurrentSession returns null when current session unset", async () => {
    const svc = new SessionService();
    dbMock.__pushSelectResult([{}]); // activeSession empty
    const res = await svc.getCurrentSession();
    expect(res).toBeNull();
  });

  it("persistSession - inserts when currentSession missing and throws when same as current", async () => {
    const svc = new SessionService();

    // schSession exists, no currentSession
    dbMock.__pushSelectResult([{ id: "s1", schoolSession: "2022/2023" }]);
    dbMock.__pushSelectResult([]); // currentSession missing
    await expect(svc.persistSession("2022/2023")).resolves.toBeUndefined();

    // when current session equals provided, BadRequest
    dbMock.__pushSelectResult([{ id: "s1", schoolSession: "2022/2023" }]);
    dbMock.__pushSelectResult([{ currentSession: "2022/2023" }]);
    await expect(svc.persistSession("2022/2023")).rejects.toThrow(BadRequest);
  });

  it("updateSession updates currentSession when needed", async () => {
    const svc = new SessionService();
    // schSession exists
    dbMock.__pushSelectResult([{ id: "s1", schoolSession: "old" }]);
    // currentSession equals old
    dbMock.__pushSelectResult([{ currentSession: "old" }]);

    const oldUpdate = dbMock.update;
    const mockUpdate = vi.fn(async () => [{ affectedRows: 1 }]);
    dbMock.update = mockUpdate as any;

    await svc.updateSession("old", "new");
    expect(mockUpdate.mock.calls.length).toBeGreaterThan(0);

    dbMock.update = oldUpdate;
  });

  it("lockRegistration and unlockRegistration success and NotFound", async () => {
    const svc = new SessionService();
    // lockRegistration success
    dbMock.__pushSelectResult([{ id: "u1" }]); // user exists
    dbMock.__pushSelectResult([{ id: "s1", schoolSession: "2022/2023" }]);
    await expect(
      svc.lockRegistration("2022/2023", "u1"),
    ).resolves.toBeUndefined();

    // lockRegistration user not found
    dbMock.__pushSelectResult([]);
    await expect(svc.lockRegistration("2022/2023", "uX")).rejects.toThrow(
      NotFound,
    );

    // unlockRegistration success
    dbMock.__pushSelectResult([{ id: "s1", schoolSession: "2022/2023" }]);
    await expect(svc.unlockRegistration("2022/2023")).resolves.toBeUndefined();

    // unlockRegistration not found
    dbMock.__pushSelectResult([]);
    await expect(svc.unlockRegistration("nope")).rejects.toThrow(NotFound);
  });

  it("getAllSessions returns list", async () => {
    const svc = new SessionService();
    dbMock.__pushSelectResult([
      { id: "s1", schoolSession: "2021/2022" },
      { id: "s2", schoolSession: "2022/2023" },
    ]);
    const all = await svc.getAllSessions();
    expect(all.length).toBeGreaterThan(0);
  });
});
