import Bull from "bull";
import type { Job } from "bull";
import type { EmailPayload } from "../types";
import { logger } from "./logger";
import { Email } from "../mails/email";

const retries: number = 3;
const delay: number = 1000 * 60 * 5;

const email = new Email();

const emailQueue = new Bull("Email", {
  redis: {
    host: process.env.REDIS_HOST as string,
    port: Number(process.env.REDIS_PORT),
  },
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

emailQueue.process(async (job: Job, done) => {
  try {
    await email.sendMail(job.data);
    job.log("Email sent successfully to " + job.data.to);
    logger.info("Email sent successfully!");
  } catch (e) {
    throw e;
  } finally {
    done();
  }
});

emailQueue.on("completed", (job: Job) => {
  logger.info(`Job with id ${job.id} has been completed`);
});

emailQueue.on("failed", (job: Job, error: Error) => {
  logger.info(`Job with id ${job.id} has failed with error: ${error.message}`);
});

export { addMailToQueue, emailQueue };
