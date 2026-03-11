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
import { session } from "./session";

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
    semester: varchar("semester", {length: 36})
      .notNull()
      .references(() => session.id, { onDelete: "cascade" }),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
  },
  (table) => [
    unique("unique_user_course_semester_year").on(
      table.userId,
      table.courseId,
      table.semester,
    ),
  ],
);
