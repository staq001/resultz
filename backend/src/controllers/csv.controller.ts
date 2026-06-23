import { CSV } from "@/services/csv.services";
import type { AppEnv, CsvRowType, parserOptions } from "@/types";
import { addCSVToQueue } from "@/utils/queue";
import { logger } from "@/utils/logger";
import type { Context } from "hono";

export class CSVController {
  private csv: CSV;

  constructor() {
    this.csv = new CSV();
  }

  processCSV = async (c: Context<AppEnv>) => {
    const body = await c.req.parseBody();
    const file = body["csv"] as File;

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded or invalid file format" }, 400);
    }
    const semesterId = c.req.param("semesterId");
    const { courseCode } = c.req.query();
    const type = c.req.query("type") as CsvRowType;

    if (!type) {
      return c.json({ error: "Missing type field" }, 400);
    }

    const { id } = c.get("user");

    try {
      const { fileId, bucket, objectKey } = await this.csv.uploadCSV(file, id);

      await this.queueCSV(fileId, bucket, objectKey, type, {
        courseCode,
        createdBy: id,
        semesterId,
      });

      return c.json(
        {
          status: 202,
          message: "Csv processing",
        },
        202,
      );
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  private queueCSV = async (
    fileId: string,
    bucket: string,
    objectKey: string,
    type: CsvRowType,
    options?: parserOptions,
  ) => {
    try {
      if (options && type === "courses") {
        const { createdBy } = options;
        await addCSVToQueue(fileId, bucket, objectKey, type, { createdBy });
      }
      if (options && type === "scores") {
        const { courseCode, semesterId } = options;
        await addCSVToQueue(fileId, bucket, objectKey, type, {
          courseCode,
          semesterId,
        });
      }
      if (type === "departments")
        await addCSVToQueue(fileId, bucket, objectKey, type);
    } catch (e: any) {
      logger.error(`Failed to process csv: ${e}`);
      throw e;
    }
  };
}
