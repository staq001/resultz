import { mysqlTable, varchar, timestamp, json } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const emails = mysqlTable("emails", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .default(sql`(uuid())`),
  templateId: varchar("template_id", { length: 255 }).notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  variables: json("variables"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
