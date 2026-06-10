import { describe, it, expect, beforeEach, vi } from "bun:test";
import { dbMock } from "../helpers/dbMock";

vi.mock("../../src/db/mysql", () => ({ db: dbMock }));

import { TokenActivation } from "../../src/services/tokenActivation.service";
import { throwAppError } from "../../src/utils/error";

describe("TokenActivation service", () => {
  beforeEach(() => dbMock.__clear());

  it("isMatch returns true when tokens match and false otherwise", () => {
    const svc = new TokenActivation();
    expect((svc as any).isMatch("abc", "abc")).toBe(true);
    expect((svc as any).isMatch("abc", "def")).toBe(false);
  });

  it("verifyToken - returns false when no token found", async () => {
    const svc = new TokenActivation();
    dbMock.__pushSelectResult([]);
    const res = await svc.verifyToken("tok", "u1");
    expect(res).toBe(false);
  });

  it("verifyToken - throws when token expired", async () => {
    const svc = new TokenActivation();
    const oldDate = new Date(Date.now() - 1000 * 60 * 60);
    dbMock.__pushSelectResult([{ expiresAt: oldDate, isUsed: false, token: "tok", userId: "u1" }]);
    await expect(svc.verifyToken("tok", "u1")).rejects.toThrow(throwAppError);
  });
});
