import { Storage } from "@google-cloud/storage";
import { logger } from "@/utils/logger";

export const storage = new Storage({
  projectId: Bun.env.GCP_PROJECT_ID as string,
  keyFilename: Bun.env.GCP_CREDENTIALS_PATH as string,
});

export async function verifyBucket(bucketName: string) {
  try {
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();

    if (!exists) {
      await storage.createBucket(bucketName, {
        location: "US",
        storageClass: "STANDARD",
      });
      logger.info(`Bucket created successfully.`);
    }
    return bucket;
  } catch (e: any) {
    throw e;
  }
}
