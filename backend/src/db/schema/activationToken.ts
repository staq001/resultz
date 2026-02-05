import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/mysql-core";
import { users } from "./user";

export const activationTokens = mysqlTable("activation_tokens", {
  token: varchar("token", { length: 100 }).notNull(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
