import {
  mysqlTable,
  varchar,
  timestamp,
  uniqueIndex,
  int,
} from "drizzle-orm/mysql-core";
import { users } from "./user";
import { courses } from "./course";
import { sql } from "drizzle-orm";

export const courseRegistrations = mysqlTable(
  "course_registrations",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .notNull()
      .default(sql`(uuid())`),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: varchar("course_id", { length: 36 })
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    semester: int("semester").notNull(),
    year: int("year").notNull(),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_user_course").on(table.userId, table.courseId),
  ],
);
