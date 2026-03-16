import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const currentSession = mysqlTable("current_session", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .default(sql`(uuid())`),
  currentSession: varchar("current_session", { length: 255 })
    .notNull()
    .default("false"),
});
