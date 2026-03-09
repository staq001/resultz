import {
  mysqlTable,
  varchar,
  timestamp,
  unique,
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
    unique("unique_user_course_semester_year").on(
      table.userId,
      table.courseId,
      table.semester,
      table.year,
    ),
  ],
);
