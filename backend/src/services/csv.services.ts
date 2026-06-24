import { logger } from "@/utils/logger";
import { BadRequest, NotFound, InternalServerError } from "@/utils/error";
import { verifyBucket } from "@/utils/googleCloud";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { NewCSV } from "@/types";
import { db } from "@/db/mysql";
import { csv } from "@/db/schema";
import { eq } from "drizzle-orm";

export class CSV {
  async uploadCSV(file: File, uploadedBy: string) {
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

      const filename = id + file.name;

      await this.insertWithContext({
        filename,
        bucket: bucket.name,
        objectKey,
        uploadedBy,
        contentType: file.type,
      });
      const fileId = await this.getFileRecord(filename);

      return {
        fileId: fileId.id,
        bucket: bucket.name,
        objectKey,
        originalName: file.name,
        contentType: file.type,
      };
    } catch (e: any) {
      logger.error(`Error uploading csv file: ${e.message}`);
      if (e instanceof BadRequest) throw e;
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error uploading csv file");
    }
  }

  async updateFileRecord(id: string, values: Partial<NewCSV>) {
    try {
      await db.update(csv).set(values).where(eq(csv.id, id));
    } catch (e: any) {
      logger.error(`Error updating file record: ${e.message}`);
      throw e;
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

  private async getFileRecord(filename: string) {
    try {
      const [csvRecord] = await db
        .select({ id: csv.id })
        .from(csv)
        .where(eq(csv.filename, filename));

      if (!csvRecord) throw new NotFound("File record not found!");
      return csvRecord;
    } catch (e) {
      throw e;
    }
  }

  private async insertWithContext(values: NewCSV) {
    try {
      await db.insert(csv).values(values);
    } catch (e: any) {
      throw e;
    }
  }
}
