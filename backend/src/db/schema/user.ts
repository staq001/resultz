import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .default(sql`(uuid())`),
  name: varchar("name", { length: 255 }).notNull(),
  matricNo: varchar("matric_no", { length: 20 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false),
  isStaff: boolean("is_staff").default(false),
  avatar: varchar("avatar", { length: 255 }),
  publicId: varchar("avatar_public_id", { length: 255 }),
  softDeleted: boolean("soft_deleted").default(false),
  isVerified: boolean("is_verified").default(false),
  isRusticated: boolean("is_rusticated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
