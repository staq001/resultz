import Bull from "bull";
import type { Job } from "bull";
import type { EmailPayload, parserOptions } from "../types";
import { logger } from "./logger";
import { Email } from "../mails/email";
import { storage } from "./googleCloud";
import { parser } from "./csvParser";
import { CSV } from "@/services/csv.services";

const { updateFileRecord } = new CSV();

const retries: number = 3;
const delay: number = 1000 * 60 * 5;

const email = new Email();

const emailQueue = new Bull("Email", {
  redis: Bun.env.REDIS_URL,
});

const addMailToQueue = async (data: EmailPayload) => {
  await emailQueue.add(data, {
    attempts: retries,
    backoff: {
      type: "fixed",
      delay,
    },
  });
};

emailQueue.process(async (job: Job) => {
  try {
    await email.sendMail(job.data);
    job.log("Email sent successfully to " + job.data.toEmail);
    logger.info("Email sent successfully!");
  } catch (e) {
    throw e;
  }
});

emailQueue.on("completed", (job: Job) => {
  logger.info(`Job with id ${job.id} has been completed`);
});

emailQueue.on("failed", (job: Job, error: Error) => {
  logger.info(`Job with id ${job.id} has failed with error: ${error.message}`);
});

// csv

const csvQueue = new Bull("CSV", {
  redis: Bun.env.REDIS_URL,
});

export type CSVJob = "departments" | "courses" | "scores";

const addCSVToQueue = async (
  fileId: string,
  bucket: string,
  objectKey: string,
  type: CSVJob,
  options?: parserOptions,
) => {
  await csvQueue.add(
    { fileId, bucket, objectKey, options, type },
    {
      attempts: retries,
      backoff: {
        type: "fixed",
        delay,
      },
    },
  );
};

csvQueue.process(async (job: Job) => {
  const fileId: string | undefined = job.data.fileId;

  try {
    const bucket = storage.bucket(job.data.bucket);
    const file = bucket.file(job.data.objectKey);
    const type: CSVJob = job.data.type;
    const options: parserOptions = job.data.options ?? {};

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("File does not exist");
    }
    let stats;

    if (type === "courses") {
      stats = await parser(file, type, { createdBy: options.createdBy });
    }
    if (type === "departments") {
      stats = await parser(file, type);
    }
    if (type === "scores") {
      stats = await parser(file, type, {
        courseCode: options.courseCode,
        semesterId: options.semesterId,
      });
    }

    // update file record;
    if (stats && fileId) {
      const inserted =
        stats?.inserted.courses +
        stats?.inserted.departments +
        stats?.inserted.scores;

      await updateFileRecord(fileId, {
        status: "completed",
        totalRows: stats.processed,
        insertedRows: inserted,
        failedRows: stats.skipped,
      });
    }

    const message = `CSV file processed successfully. Stats: ${JSON.stringify(stats)}`;
    job.log(message);
  } catch (e: any) {
    if (fileId) {
      await updateFileRecord(fileId, { status: "failed" });
    }

    logger.error(`CSV job ${job.id} failed: ${e.message}`);
    throw e;
  }
});

csvQueue.on("completed", (job: Job) => {
  logger.info(`Job with id ${job.id} has been completed`);
});

csvQueue.on("failed", (job: Job, error: Error) => {
  logger.info(`Job with id ${job.id} has failed with error: ${error.message}`);
});

export { addMailToQueue, emailQueue, addCSVToQueue, csvQueue };
