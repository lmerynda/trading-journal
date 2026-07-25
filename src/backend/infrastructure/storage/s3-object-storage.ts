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

function environment(...names: string[]): string | undefined {
  return names.map((name) => process.env[name]).find(Boolean);
}

function requiredEnvironment(...names: string[]): string {
  const value = environment(...names);
  if (!value) {
    throw new Error(`${names.join(" or ")} is required for object storage.`);
  }
  return value;
}

export class S3ObjectStorage implements ObjectStoragePort {
  private readonly bucket = requiredEnvironment(
    "AWS_S3_BUCKET_NAME",
    "S3_BUCKET",
  );
  private readonly client = new S3Client({
    region: environment("AWS_DEFAULT_REGION", "S3_REGION") ?? "us-east-1",
    endpoint: environment("AWS_ENDPOINT_URL", "S3_ENDPOINT"),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: requiredEnvironment("AWS_ACCESS_KEY_ID", "S3_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnvironment(
        "AWS_SECRET_ACCESS_KEY",
        "S3_SECRET_ACCESS_KEY",
      ),
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
