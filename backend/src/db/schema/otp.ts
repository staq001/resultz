import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  boolean,
  date,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "./user";

export const otps = mysqlTable("otps", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .default(sql`(uuid())`),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  otpHash: varchar("otp_hash", { length: 255 }).notNull(),
  salt: varchar("otp_hash", { length: 255 }).notNull(),
  expiresAt: date("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
