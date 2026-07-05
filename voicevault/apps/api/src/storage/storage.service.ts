import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import type { Readable } from "node:stream";
import { config } from "../config";

/** S3 requires every multipart part except the last to be >= 5 MiB. */
const MIN_PART_BYTES = 5 * 1024 * 1024;
const PART_BYTES = 8 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const cfg = config();
    this.bucket = cfg.S3_BUCKET;
    this.client = new S3Client({
      region: cfg.S3_REGION,
      endpoint: cfg.S3_ENDPOINT || undefined,
      forcePathStyle: cfg.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: cfg.S3_ACCESS_KEY_ID,
        secretAccessKey: cfg.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async putObject(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Server-side encryption at rest. MinIO ignores unknown algorithms;
        // on AWS this is AES-256 SSE-S3.
        ServerSideEncryption: "AES256",
      }),
    );
  }

  async getObjectStream(key: string): Promise<Readable> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return res.Body as Readable;
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const stream = await this.getObjectStream(key);
    const parts: Buffer[] = [];
    for await (const chunk of stream) parts.push(Buffer.from(chunk as Uint8Array));
    return Buffer.concat(parts);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  /** Expiring signed URL for playback/download — audio objects are never public. */
  async signedGetUrl(key: string, ttlSeconds = config().S3_SIGNED_URL_TTL_SECONDS): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: ttlSeconds,
    });
  }

  /**
   * Concatenate many small chunk objects into one final object without holding
   * the whole recording in memory: streams chunks in order, flushing >= 8 MiB
   * buffers as multipart parts (S3 minimum is 5 MiB except the final part).
   */
  async concatObjects(sourceKeys: string[], destKey: string, contentType: string): Promise<number> {
    const create = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: destKey,
        ContentType: contentType,
        ServerSideEncryption: "AES256",
      }),
    );
    const uploadId = create.UploadId!;
    const etags: { PartNumber: number; ETag: string }[] = [];
    let partNumber = 1;
    let pending: Buffer[] = [];
    let pendingBytes = 0;
    let totalBytes = 0;

    const flush = async () => {
      if (pendingBytes === 0) return;
      const body = Buffer.concat(pending);
      const res = await this.client.send(
        new UploadPartCommand({
          Bucket: this.bucket,
          Key: destKey,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: body,
        }),
      );
      etags.push({ PartNumber: partNumber, ETag: res.ETag! });
      partNumber += 1;
      pending = [];
      pendingBytes = 0;
    };

    for (const key of sourceKeys) {
      const stream = await this.getObjectStream(key);
      for await (const raw of stream) {
        const chunk = Buffer.from(raw as Uint8Array);
        pending.push(chunk);
        pendingBytes += chunk.length;
        totalBytes += chunk.length;
        if (pendingBytes >= PART_BYTES) await flush();
      }
    }
    // Final part may be < MIN_PART_BYTES; that's allowed for the last part.
    await flush();
    if (etags.length === 0) {
      // Zero-byte assembly is a bug upstream; surface it rather than creating
      // an empty audio object.
      throw new Error(`concatObjects: no data in sources for ${destKey} (min part ${MIN_PART_BYTES}B)`);
    }
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: destKey,
        UploadId: uploadId,
        MultipartUpload: { Parts: etags },
      }),
    );
    return totalBytes;
  }
}
