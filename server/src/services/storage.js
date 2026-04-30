// Provider-agnostic object storage. Works with any S3-compatible API:
// - Cloudflare R2:    S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com  S3_REGION=auto
// - Backblaze B2:     S3_ENDPOINT=https://s3.<region>.backblazeb2.com           S3_REGION=<region>
// - AWS S3:           S3_ENDPOINT unset                                         S3_REGION=us-east-1
// - MinIO/local:      S3_ENDPOINT=http://localhost:9000                          S3_REGION=us-east-1
//
// When S3_BUCKET is unset (or any required key is missing), helpers throw
// `STORAGE_NOT_CONFIGURED`. Callers are expected to fall back to local disk
// in that case so dev keeps working without setting up R2.

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const cfg = {
  bucket:        process.env.S3_BUCKET || '',
  endpoint:      process.env.S3_ENDPOINT || undefined,
  region:        process.env.S3_REGION || 'auto',
  accessKeyId:   process.env.S3_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  publicBaseUrl: (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/$/, ''),
  // Subpath (no trailing slash) that should be served via the public CDN URL.
  // For GERSL: 'campaigns' so donor portal images load without auth.
  publicPrefix:  process.env.S3_PUBLIC_PREFIX || 'campaigns'
};

export const isStorageConfigured = () =>
  !!(cfg.bucket && cfg.accessKeyId && cfg.secretAccessKey);

let _client = null;
const client = () => {
  if (_client) return _client;
  if (!isStorageConfigured()) {
    throw new Error('STORAGE_NOT_CONFIGURED');
  }
  _client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: !!cfg.endpoint, // R2/MinIO use path-style addressing
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey
    }
  });
  return _client;
};

export const isPublicKey = (key) => {
  if (!cfg.publicPrefix) return false;
  const top = String(key).split('/')[0];
  return top === cfg.publicPrefix;
};

export const publicUrlFor = (key) => {
  if (!cfg.publicBaseUrl) return null;
  return `${cfg.publicBaseUrl}/${key}`;
};

// Upload a Buffer / string body. Used by ad-hoc code paths; multer-s3
// handles the file-upload case directly.
export const uploadObject = async ({ key, body, contentType, cacheControl }) => {
  if (!isStorageConfigured()) throw new Error('STORAGE_NOT_CONFIGURED');
  const out = await client().send(new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl || 'public, max-age=86400'
  }));
  return { key, etag: out.ETag };
};

export const deleteObject = async (key) => {
  if (!isStorageConfigured()) throw new Error('STORAGE_NOT_CONFIGURED');
  await client().send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
};

export const objectExists = async (key) => {
  if (!isStorageConfigured()) throw new Error('STORAGE_NOT_CONFIGURED');
  try {
    await client().send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: key }));
    return true;
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') return false;
    throw err;
  }
};

// Returns a presigned GET URL valid `expiresInSec` seconds (default 1h).
export const signGetUrl = async (key, expiresInSec = 3600) => {
  if (!isStorageConfigured()) throw new Error('STORAGE_NOT_CONFIGURED');
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
    { expiresIn: expiresInSec }
  );
};

// Internal: expose config to callers that need to build a URL or check key
// shape (e.g. multer-s3 storage engine config in upload routes).
export const storageConfig = () => ({ ...cfg });

// Lazy bucket reference for multer-s3 (which expects an S3Client + bucket).
export const s3ClientForUploads = () => ({ client: client(), bucket: cfg.bucket });
