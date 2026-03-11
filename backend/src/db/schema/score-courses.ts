import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { courseRegistrations } from "./user-courses";
import { users } from ".";
import { session } from "./session";

export const scoreCourses = mysqlTable(
  "course_score",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .notNull()
      .default(sql`(uuid())`),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    registeredCourseId: varchar("registered_course_id", { length: 36 })
      .notNull()
      .references(() => courseRegistrations.id, { onDelete: "cascade" }),
    testScore: int("test_score").notNull(),
    examScore: int("exam_score").notNull(),
    semester: varchar("semester", { length: 36 })
      .notNull()
      .references(() => session.id, { onDelete: "cascade" }),
    scoredAt: timestamp("registered_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("unique_course_score").on(table.registeredCourseId)],
);
