import type { Context, Next } from "hono";
import { and, eq, getTableColumns } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { Unauthorized } from "@/utils/error";
import { users } from "@/db/schema/user";
import { db } from "@/db/mysql";
import type { AppEnv, reqUser } from "@/types";
import { verifyToken } from "@/utils";
import { verifySession } from "@/redis/session";

export class Auth {
  private owner;
  constructor(owner: string = "admin") {
    this.owner = owner;
  }

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
      if ((this.owner = "admin")) {
        if (user.isAdmin !== true) {
          return c.json({ error: "Forbidden" }, 403);
        }
        c.set("user", user as reqUser);
      } else {
        c.set("user", user as reqUser);
      }

      await next();
    } catch (e: any) {
      return c.json(
        { error: e.message || "Please authenticate" },
        e.status || 401,
      );
    }
  });

  private async tokenValidator(token: string) {
    const { email, sessionId, matricNo } = await verifyToken(token);

    try {
      if (await verifySession(sessionId)) {
        return this.getUser(email, matricNo);
      } else throw new Unauthorized("Please authenticate!");
    } catch (e) {
      throw e;
    }
  }

  private async getUser(userEmail: string, userMatricNo: number) {
    try {
      const { id, name, email, matricNo, avatar, isAdmin } =
        getTableColumns(users);

      const [user] = await db
        .select({ id, name, email, matricNo, avatar, isAdmin })
        .from(users)
        .where(
          and(eq(users.email, userEmail), eq(users.matricNo, userMatricNo)),
        );

      if (!user) throw new Unauthorized("Please authenticate!");

      return user;
    } catch (e) {
      throw e;
    }
  }
}
