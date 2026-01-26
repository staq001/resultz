import { mysqlTable, varchar, timestamp, int } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const departments = mysqlTable("departments", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .default(sql`(uuid())`),
  name: varchar("name", { length: 255 }).notNull(),
  faculty: varchar("faculty", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
