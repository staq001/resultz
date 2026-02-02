import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { courseRegistrations } from "./user-courses";

export const scoreCourses = mysqlTable(
  "course_score",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .notNull()
      .default(sql`(uuid())`),
    registeredCourseId: varchar("registered_course_id", { length: 36 })
      .notNull()
      .references(() => courseRegistrations.id, { onDelete: "cascade" }),
    score: int("score").notNull(),
    semester: int("semester").notNull(),
    year: int("year").notNull(),
    scoredAt: timestamp("registered_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("unique_course_score").on(table.registeredCourseId)],
);
