import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = 'auto'; // Cloudflare R2 uses 'auto' region
const bucketName = process.env.R2_BUCKET || 'rie-agl-cvs';

// Verify credentials for Cloudflare R2 (ensures placeholder values aren't treated as valid)
const hasCredentials = !!(
  process.env.R2_ACCESS_KEY && process.env.R2_ACCESS_KEY !== 'xxxxxxxx' &&
  process.env.R2_SECRET_KEY && process.env.R2_SECRET_KEY !== 'xxxxxxxx' &&
  process.env.R2_ENDPOINT && !process.env.R2_ENDPOINT.includes('YOUR_ACCOUNT_ID')
);

// Reusable R2 client exported exactly as requested in Step 6
export const r2 = new S3Client({
  region,
  endpoint: process.env.R2_ENDPOINT || 'https://dummy.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || 'dummy',
    secretAccessKey: process.env.R2_SECRET_KEY || 'dummy',
  },
});

/**
 * Uploads a candidate CV file buffer to Cloudflare R2.
 * Automatically enforces Server-Side Encryption (AES256).
 * If credentials are not present, falls back to a mock URL for local development/testing.
 */
export async function uploadCV(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `resumes/${timestamp}_${sanitizedName}`;

  if (!hasCredentials) {
    console.warn('[Cloudflare R2] Credentials missing in .env.local. Falling back to local mock upload.');
    return `https://${bucketName}.r2.cloudflarestorage.com/${key}`;
  }

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
      })
    );

    console.log(`[Cloudflare R2] Uploaded file successfully: ${key}`);
    return `https://${bucketName}.r2.cloudflarestorage.com/${key}`;
  } catch (error) {
    console.error('[Cloudflare R2] Failed to upload file to R2:', error);
    throw error;
  }
}

/**
 * Generates a pre-signed URL for temporary secure access to a CV in Cloudflare R2.
 * The URL expires automatically after the specified time (default 15 minutes / 900 seconds).
 */
export async function getPresignedCVUrl(
  key: string,
  fileName?: string,
  expiresInSeconds: number = 900
): Promise<string> {
  if (!hasCredentials) {
    console.warn('[Cloudflare R2] Credentials missing. Returning mock URL.');
    return `https://${bucketName}.r2.cloudflarestorage.com/${key}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: fileName ? `attachment; filename="${fileName}"` : undefined,
    });

    const signedUrl = await getSignedUrl(r2, command, {
      expiresIn: expiresInSeconds,
    });

    return signedUrl;
  } catch (error) {
    console.error('[Cloudflare R2] Failed to generate pre-signed URL:', error);
    throw error;
  }
}

/**
 * Uploads a profile picture to Cloudflare R2 under the 'avatars/' prefix.
 */
export async function uploadAvatar(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `avatars/${timestamp}_${sanitizedName}`;

  if (!hasCredentials) {
    console.warn('[Cloudflare R2] Credentials missing. Falling back to local mock upload.');
    return `https://${bucketName}.r2.cloudflarestorage.com/${key}`;
  }

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      })
    );
    return `https://${bucketName}.r2.cloudflarestorage.com/${key}`;
  } catch (error) {
    console.error('[Cloudflare R2] Failed to upload avatar to R2:', error);
    throw error;
  }
}


