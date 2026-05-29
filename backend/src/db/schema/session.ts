import {
  mysqlTable,
  varchar,
  mysqlEnum,
  timestamp,
} from "drizzle-orm/mysql-core";
import { users } from "./user";
import { sql } from "drizzle-orm";

export const session = mysqlTable("session", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .default(sql`(uuid())`),
  schoolSession: varchar("sch_session", { length: 255 }).notNull(),
  registration_status: mysqlEnum("registration_status", ["Locked", "Open"])
    .notNull()
    .default("Open"),
  lockedBy: varchar("locked_by", { length: 255 }).references(() => users.id),
  lockedAt: timestamp("locked_at"),
});
