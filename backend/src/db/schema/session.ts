import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const session = mysqlTable("session", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .default(sql`(uuid())`),
  schoolSession: varchar("sch_session", { length: 255 }).notNull(),
});
