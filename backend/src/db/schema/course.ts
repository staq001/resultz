import { mysqlTable, varchar, timestamp, int } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "./user";
import { departments } from "./department";

export const courses = mysqlTable("courses", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .default(sql`(uuid())`),
  courseCode: varchar("course_code", { length: 50 }).notNull(),
  units: int("units").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  departmentId: varchar("department_id", { length: 255 })
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by", { length: 255 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
