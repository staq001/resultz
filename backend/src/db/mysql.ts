import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";
import { logger } from "@/utils/logger";

const connection = mysql.createPool(process.env.DATABASE_URL!);

export const db = drizzle(connection, { schema, mode: "default" });

async function testConnection() {
  try {
    const conn = await connection.getConnection();
    conn.release();
    logger.info("Connected to Database successfully.");
  } catch (error) {
    logger.error(`Database connection failed: ${error}`);
  }
}

testConnection();
