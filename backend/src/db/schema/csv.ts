import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  int,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "./user";

export const csv = mysqlTable("csv", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .notNull()
    .default(sql`(uuid())`),
  filename: varchar("file_name", { length: 255 }).notNull(),
  bucket: varchar("bucket", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 255 }).notNull(),
  objectKey: varchar("object_key", { length: 255 }).notNull(),
  uploadedBy: varchar("object_key", { length: 255 })
    .notNull()
    .references(() => users.id),
  status: mysqlEnum("status", ["processing", "completed"])
    .notNull()
    .default("processing"),
  totalRows: int("total_rows"),
  insertedRows: int("inserted_rows"),
  failedRows: int("failed_rows"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
