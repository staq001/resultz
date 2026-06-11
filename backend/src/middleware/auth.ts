import type { Context, Next } from "hono";
import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import * as jose from "jose";

import { Unauthorized } from "@/utils/error";
import { users } from "@/db/schema/user";
import { db } from "@/db/mysql";
import type { AppEnv, reqUser } from "@/types";
import { verifyToken } from "@/utils";
import { verifySession } from "@/redis/session";

export class Auth {
  authentication = createMiddleware<AppEnv>(async (c: Context, next: Next) => {
    try {
      const authHeader = c.req.header("Authorization");

      if (!authHeader) {
        return c.json({ error: "Please authenticate" }, 401);
      }

      const token = authHeader.replace("Bearer ", "");
      if (!token) {
        return c.json({ error: "Please authenticate" }, 401);
      }

      const user = await this.tokenValidator(token);
      c.set("user", user);

      await next();
    } catch (e: any) {
      if (e instanceof jose.errors.JWTExpired || e.code === "ERR_JWT_EXPIRED") {
        return c.json({ error: "Please authenticate" }, 401);
      }
      return c.json(
        { error: e.message || "Please authenticate" },
        e.status || 401,
      );
    }
  });

  adminProtectedRoute = createMiddleware<AppEnv>(
    async (c: Context, next: Next) => {
      try {
        const user = c.get("user") as reqUser;

        if (!user || !user.isAdmin) {
          return c.json({ error: "Unauthorized" }, 403);
        }

        await next();
      } catch (e: any) {
        return c.json({ error: e.message || "Forbidden" }, e.status || 403);
      }
    },
  );

  staffProtectedRoute = createMiddleware<AppEnv>(
    async (c: Context, next: Next) => {
      try {
        const user = c.get("user");

        if (!user || !user.isStaff) {
          return c.json({ error: "Unauthorized" }, 403);
        }

        await next();
      } catch (e: any) {
        return c.json({ error: e.message || "Forbidden" }, e.status || 403);
      }
    },
  );

  adminOrStaffProtectedRoute = createMiddleware<AppEnv>(
    async (c: Context, next: Next) => {
      try {
        const user = c.get("user") as reqUser;

        if (!user || (!user.isAdmin && !user.isStaff)) {
          return c.json({ error: "Unauthorized" }, 403);
        }

        await next();
      } catch (e: any) {
        return c.json({ error: e.message || "Forbidden" }, e.status || 403);
      }
    },
  );

  private async tokenValidator(token: string) {
    const { email, sessionId, id } = await verifyToken(token);

    try {
      const sessionValid = await verifySession(sessionId);
      if (sessionValid) {
        return this.getUser(email, id);
      } else throw new Unauthorized("Please authenticate!");
    } catch (e) {
      throw e;
    }
  }

  private async getUser(userEmail: string, userId: string) {
    try {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          matricNo: users.matricNo,
          department: users.department,
          entryYear: users.entryYear,
          avatar: users.avatar,
          isAdmin: users.isAdmin,
          softDeleted: users.softDeleted,
          isRusticated: users.isRusticated,
          isStaff: users.isStaff,
        })
        .from(users)
        .where(and(eq(users.email, userEmail), eq(users.id, userId)));

      if (!user || user.softDeleted)
        throw new Unauthorized("Please authenticate!");

      const { softDeleted, ...userWithoutSoftDeleted } = user;
      return userWithoutSoftDeleted;
    } catch (e) {
      throw e;
    }
  }
}
