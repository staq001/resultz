import Bull from "bull";
import type { Job } from "bull";
import type { EmailPayload } from "../types";
import { logger } from "./logger";
import { Email } from "../mails/email";
import { storage } from "./googleCloud";

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

const csvQueue = new Bull("CSV", {
  redis: Bun.env.REDIS_URL,
});

const addCSVToQueue = async (bucket: string, objectKey: string) => {
  await csvQueue.add(
    { bucket, objectKey },
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
  try {
    // const { bucket, objectKey, contentType } = await csv.uploadCSV(job.data);

    const bucket = storage.bucket(job.data.bucket);
    const file = bucket.file(job.data.objectKey);

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File ${job.data.objectKey} does not exist`);
    }

    const readStream = file.createReadStream();

    job.log("CSV file processed successfully: " + job.data);
  } catch (e) {
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
