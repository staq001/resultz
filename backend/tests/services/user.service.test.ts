import { describe, it, expect, beforeEach, vi } from "bun:test";
import { dbMock } from "../helpers/dbMock";

vi.mock("../../src/db/mysql", () => ({ db: dbMock }));

vi.mock("../../src/utils/argon", () => ({
  hashPassword: vi.fn(async (p: string) => `hashed_${p}`),
  default: vi.fn(async (h: string, p: string) => h === `hashed_${p}`),
}));

vi.mock("../../src/utils/index", () => ({
  generateAuthToken: vi.fn(async (p: any) => `token-${p.id ?? "x"}`),
  generateOTP: vi.fn(() => 123456),
  verifyToken: vi.fn(async (t: string) => ({ sessionId: "sess-1" })),
  createHash: vi.fn((d: string) => ({ hash: "h", salt: "s" })),
  verifyHash: vi.fn((d: string, s: string, h: string) => d === "123456"),
}));

vi.mock("../../src/db/validateCredentials", () => ({
  validateCredentials: vi.fn(async (c: any) => ({
    email: c.email ?? "e@x",
    id: "u1",
  })),
}));

vi.mock("../../src/redis/session", () => ({
  setSession: vi.fn(async () => {}),
  deleteSession: vi.fn(async () => {}),
}));

vi.mock("../../src/redis/lockup", () => ({
  isAccountLocked: vi.fn(async () => false),
  recordFailure: vi.fn(async () => {}),
  recordSuccess: vi.fn(async () => {}),
}));

vi.mock("cloudinary", () => ({
  v2: {
    uploader: {
      destroy: vi.fn(async () => {}),
      upload: vi.fn(async () => ({
        secure_url: "https://cdn/test.png",
        public_id: "pub1",
      })),
    },
  },
}));

vi.mock("hono/utils/encode", () => ({ encodeBase64: vi.fn(() => "YmJj") }));

import {
  BadRequest,
  NotFound,
  Unauthorized,
  Conflict,
  throwAppError,
} from "../../src/utils/error";

let UserServiceClass: any;
let svc: any;

beforeEach(async () => {
  dbMock.__clear();
  const mod = await import("../../src/services/user.service");
  UserServiceClass = mod.UserService;
  svc = new UserServiceClass();
});

describe("UserService (comprehensive)", () => {
  it("createUser - success path", async () => {
    dbMock.__pushSelectResult([]); // matricNo check
    dbMock.__pushSelectResult([]); // email check
    dbMock.__pushSelectResult([{ id: "dept1" }]); // department exists

    const payload = {
      email: "a@b.com",
      matricNo: "M001",
      password: "p",
      department: "CS",
    } as any;

    const res = await svc.createUser(payload);
    expect(res.email).toBe("a@b.com");
    expect(res.matricNo).toBe("M001");
  });

  it("createUser - conflicts on existing email", async () => {
    // no matricNo in payload, so only push the email check result
    dbMock.__pushSelectResult([{ id: "u1", email: "a@b.com" }]); // existing email

    await expect(
      svc.createUser({ email: "a@b.com", password: "p" } as any),
    ).rejects.toThrow(Conflict);
  });

  it("createUser - department missing becomes InternalServerError (per implementation)", async () => {
    dbMock.__pushSelectResult([]); // matricNo
    dbMock.__pushSelectResult([]); // email
    dbMock.__pushSelectResult([]); // dept not found

    await expect(
      svc.createUser({
        email: "x@x",
        password: "p",
        department: "Nope",
      } as any),
    ).rejects.toThrow();
  });

  it("login - success and sets session", async () => {
    const validateMod = await import("../../src/db/validateCredentials");
    (validateMod.validateCredentials as any).mockResolvedValue({
      email: "u@x",
      id: "u1",
    });

    const utils = await import("../../src/utils/index");
    (utils.generateAuthToken as any).mockResolvedValue("tok-123");

    const sessionMod = await import("../../src/redis/session");

    const result = await svc.login({
      email: "u@x",
      password: "p",
      loginType: "email",
    } as any);
    expect(result.token).toBe("tok-123");
    expect((sessionMod.setSession as any).mock.calls.length).toBeGreaterThan(0);
  });

  it("login - propagate NotFound and Unauthorized from validateCredentials", async () => {
    const validateMod = await import("../../src/db/validateCredentials");
    (validateMod.validateCredentials as any).mockRejectedValueOnce(
      new NotFound("no user"),
    );
    await expect(
      svc.login({ email: "x", password: "p", loginType: "email" } as any),
    ).rejects.toThrow(NotFound);

    (validateMod.validateCredentials as any).mockRejectedValueOnce(
      new Unauthorized("bad"),
    );
    await expect(
      svc.login({ email: "x", password: "p", loginType: "email" } as any),
    ).rejects.toThrow(Unauthorized);
  });

  it("logout - success deletes session", async () => {
    const utils = await import("../../src/utils/index");
    (utils.verifyToken as any).mockResolvedValue({ sessionId: "sess-1" });
    const sessionMod = await import("../../src/redis/session");

    const req = { header: (_: string) => "Bearer sometoken" } as any;
    await svc.logout(req);
    expect((sessionMod.deleteSession as any).mock.calls.length).toBeGreaterThan(
      0,
    );
  });

  it("logout - missing auth throws InternalServerError", async () => {
    const req = { header: (_: string) => null } as any;
    await expect(svc.logout(req)).rejects.toThrow();
  });

  it("updateUserName/updatePassword - success and NotFound paths", async () => {
    // success
    const res = await svc.updateUserName("u1", "New Name");
    expect(res).toBeDefined();

    // simulate affectedRows 0 -> NotFound
    const oldUpdate = dbMock.update;
    dbMock.update = (...args: any) => {
      const b: any = oldUpdate(...args);
      b.then = (resolve: any, _reject: any) =>
        Promise.resolve([{ affectedRows: 0 }]).then(resolve);
      return b;
    };
    await expect(svc.updateUserName("u1", "Name")).rejects.toThrow(NotFound);
    dbMock.update = oldUpdate;

    // updatePassword success
    const argon = await import("../../src/utils/argon");
    (argon.hashPassword as any).mockResolvedValue("hashedpass");
    const up = await svc.updatePassword("u1", "abc");
    expect(up).toBeDefined();

    // updatePassword not found
    dbMock.update = (...args: any) => {
      const b: any = oldUpdate(...args);
      b.then = (resolve: any, _reject: any) =>
        Promise.resolve([{ affectedRows: 0 }]).then(resolve);
      return b;
    };
    await expect(svc.updatePassword("u1", "abc")).rejects.toThrow(NotFound);
    dbMock.update = oldUpdate;
  });

  it("deleteUser and rusticateUser handle success and not found", async () => {
    // deleteUser success uses affectedRows present
    const delRes = await svc.deleteUser("u1");
    expect(delRes).toBeDefined();

    // simulate no result -> NotFound
    const oldUpdate = dbMock.update;
    dbMock.update = (...args: any) => {
      const b: any = oldUpdate(...args);
      b.then = (resolve: any, _reject: any) =>
        Promise.resolve([]).then(resolve);
      return b;
    };
    await expect(svc.deleteUser("u1")).rejects.toThrow(NotFound);
    dbMock.update = oldUpdate;

    // rusticateUser success
    const rust = await svc.rusticateUser("u1");
    expect(rust).toBeDefined();

    dbMock.update = (...args: any) => {
      const b: any = oldUpdate(...args);
      b.then = (resolve: any, _reject: any) =>
        Promise.resolve([]).then(resolve);
      return b;
    };
    await expect(svc.rusticateUser("u1")).rejects.toThrow(NotFound);
    dbMock.update = oldUpdate;
  });

  it("uploadAvatar and upload private helper", async () => {
    // prepare user
    dbMock.__pushSelectResult([{ id: "u1", publicId: "oldPub" }]);

    // spy upload
    const uploadSpy = vi.spyOn(svc as any, "upload").mockResolvedValue({
      secure_url: "https://cdn/new.png",
      publicId: "newPub",
    });

    const file = { size: 1000, type: "image/png" } as any;
    const res = await svc.uploadAvatar("u1", file);
    expect(res.newUrl).toBe("https://cdn/new.png");

    // restore original upload implementation so we can test the private helper behavior
    uploadSpy.mockRestore();

    // upload helper
    const tooBig = {
      size: 4 * 1024 * 1024,
      type: "image/png",
      arrayBuffer: async () => new ArrayBuffer(1),
    } as any;
    await expect((svc as any).upload(tooBig)).rejects.toThrow(BadRequest);

    const smallFile = {
      size: 100,
      type: "image/png",
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    } as any;
    const upRes = await (svc as any).upload(smallFile, "oldPub");
    expect(upRes.secure_url).toBeDefined();
    expect(upRes.publicId).toBeDefined();
  });

  it("createOTP/sendOTP/verifyOTP flows", async () => {
    // createOTP via sendOTP
    const spy = vi
      .spyOn(UserServiceClass.prototype as any, "createOTP")
      .mockResolvedValue(123456);
    await svc.sendOTP("u1");
    expect(spy.mock.calls.length).toBeGreaterThan(0);
    spy.mockRestore();

    // verifyOTP  returns false
    dbMock.__pushSelectResult([]);
    const noOtp = await svc.verifyOTP("u1", 111111);
    expect(noOtp).toBe(false);

    // verifyOTP expired
    const past = new Date(Date.now() - 1000 * 60 * 10);
    dbMock.__pushSelectResult([
      { otpHash: "h", isUsed: false, salt: "s", expiresAt: past },
    ]);
    await expect(svc.verifyOTP("u1", 123456)).rejects.toThrow(throwAppError);

    // verifyOTP used
    const future = new Date(Date.now() + 1000 * 60 * 10);
    dbMock.__pushSelectResult([
      { otpHash: "h", isUsed: true, salt: "s", expiresAt: future },
    ]);
    await expect(svc.verifyOTP("u1", 123456)).rejects.toThrow(throwAppError);

    // verifyOTP  wrong otp
    const verifyMod = await import("../../src/utils/index");
    (verifyMod.verifyHash as any).mockReturnValueOnce(false);
    dbMock.__pushSelectResult([
      { otpHash: "h", isUsed: false, salt: "s", expiresAt: future },
    ]);
    const lockup = await import("../../src/redis/lockup");
    await expect(svc.verifyOTP("u1", 111111)).rejects.toThrow(throwAppError);
    expect((lockup.recordFailure as any).mock.calls.length).toBeGreaterThan(0);

    // verifyOTP  correct otp
    (verifyMod.verifyHash as any).mockReturnValueOnce(true);
    dbMock.__pushSelectResult([
      { otpHash: "h", isUsed: false, salt: "s", expiresAt: future },
    ]);
    const ok = await svc.verifyOTP("u1", 123456);
    expect(ok).toBe(true);
    expect((lockup.recordSuccess as any).mock.calls.length).toBeGreaterThan(0);
  });

  it("getUserById/getUserByEmail and insertWithContext", async () => {
    dbMock.__pushSelectResult([{ id: "u1", name: "A" }]);
    const user = await (svc as any).getUserById("u1");
    expect(user.name).toBe("A");

    dbMock.__pushSelectResult([]);
    await expect((svc as any).getUserById("nope")).rejects.toThrow(NotFound);

    // getUserByEmail
    dbMock.__pushSelectResult([{ id: "u1", email: "a@b" }]);
    const ue = await svc.getUserByEmail("a@b");
    expect(ue.email).toBe("a@b");

    // insertWithContext success
    const ins = await (svc as any).insertWithContext("table", { x: 1 });
    expect(ins.values).toBeDefined();

    // insertWithContext failure
    const oldInsert = dbMock.insert;
    dbMock.insert = async () => [{ affectedRows: 0 }];
    await expect(
      (svc as any).insertWithContext("t", { x: 1 }),
    ).rejects.toThrow();
    dbMock.insert = oldInsert;
  });
});
