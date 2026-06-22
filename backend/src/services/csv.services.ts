import { logger } from "@/utils/logger";
import { BadRequest, NotFound, InternalServerError } from "@/utils/error";
import { verifyBucket } from "@/utils/googleCloud";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export class CSV {
  async uploadCSV(file: File) {
    if (!file) {
      throw new BadRequest("No file provided for upload");
    }
    if (!file.name.endsWith(".csv")) {
      throw new BadRequest("Invalid file type. Only CSV files are allowed.");
    }

    let id = crypto.randomUUID();
    const objectKey = `csv/${id}/${file.name}`;

    try {
      const bucket = await verifyBucket(Bun.env.GCP_BUCKET_NAME as string);
      const destination = bucket.file(objectKey);

      const writeStream = destination.createWriteStream({
        resumable: true,
        contentType: file.type,
      });

      const readStream = Readable.fromWeb(file.stream());

      await pipeline(readStream, writeStream);

      // create db record.

      return {
        bucket: bucket.name,
        objectKey,
        originalName: file.name,
        contentType: file.type,
      };
    } catch (e: any) {
      logger.error("Error uploading csv file, ${e}");
      if (e instanceof BadRequest) throw e;
      throw new InternalServerError("Error uploading csv file");
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const bucket = await verifyBucket(Bun.env.GCP_BUCKET_NAME as string);
      const file = bucket.file(fileName);
      const [exists] = await file.exists();

      if (!exists) {
        throw new NotFound(`File ${fileName} not found in bucket`);
      }

      await file.delete();
      logger.info(`File ${fileName} deleted successfully!`);
    } catch (e: any) {
      logger.error(`Error deleting csv file, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError(`Error deleting csv file`);
    }
  }

  random() {
    // parse csv
    // add 1000 entries at once. whichever doesnt make it throws an error and the rest are added.
    //
  }
}
