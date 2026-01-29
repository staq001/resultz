import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  boolean,
} from "drizzle-orm/mysql-core";
import { eq, getTableColumns, sql } from "drizzle-orm";
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

export async function validateCredentials(
  inputEmail: string,
  inputPassword: string,
) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, inputEmail));

    if (!user || user.softDeleted)
      throw new NotFound("Wrong email/password combination");

    if (!user || user.isVerified)
      throw new NotFound("Please verify your account");

    if (await isAccountLocked(inputEmail))
      throw new Unauthorized("Account locked. Try again in 10 minutes");

    if (user && user.password) {
      const isMatch = verifyPassword(user.password, inputPassword);
      if (!isMatch) {
        await recordFailure(inputEmail);
        throw new NotFound("Wrong email/password combination");
      }
      await recordSuccess(inputEmail);
    }
    return user;
  } catch (e) {
    throw e;
  }
}
