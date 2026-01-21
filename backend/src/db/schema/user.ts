import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  boolean,
} from "drizzle-orm/mysql-core";
import { eq, sql } from "drizzle-orm";
import { db } from "../mysql";
import { NotFound, Unauthorized } from "../../utils/error";
import {
  isAccountLocked,
  recordFailure,
  recordSuccess,
} from "../../redis/lockup";
import verifyPassword from "../../utils/argon";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .default(sql`(uuid())`),
  name: varchar("name", { length: 255 }).notNull(),
  matricNo: int("matric_no").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false),
  avatar: varchar("avatar", { length: 255 }),
  publicId: varchar("avatar_public_id", { length: 255 }),
  softDeleted: boolean("soft_deleted").default(false),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export async function validateCredentials(email: string, password: string) {
  try {
    const user = await db.select().from(users).where(eq(users.email, email));

    if (!user[0] || user[0].softDeleted)
      throw new NotFound("Wrong email/password combination");

    if (await isAccountLocked(email))
      throw new Unauthorized("Account locked. Try again in 10 minutes");

    if (user[0] && user[0].password) {
      const isMatch = await verifyPassword(user[0].password, password);
      if (!isMatch) {
        await recordFailure(email);
        throw new NotFound("Wrong email/password combination");
      }
      await recordSuccess(email);
    }
    return user[0];
  } catch (e) {
    throw e;
  }
}
