import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  ObjectStoragePort,
  StoredObject,
} from "../../ports/object-storage";

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for object storage.`);
  return value;
}

export class S3ObjectStorage implements ObjectStoragePort {
  private readonly bucket = requiredEnvironment("S3_BUCKET");
  private readonly client = new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: requiredEnvironment("S3_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnvironment("S3_SECRET_ACCESS_KEY"),
    },
  });

  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<StoredObject | undefined> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!result.Body) return undefined;
      return {
        body: await result.Body.transformToByteArray(),
        contentType: result.ContentType ?? "application/octet-stream",
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "$metadata" in error &&
        (error.$metadata as { httpStatusCode?: number }).httpStatusCode === 404
      ) {
        return undefined;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
