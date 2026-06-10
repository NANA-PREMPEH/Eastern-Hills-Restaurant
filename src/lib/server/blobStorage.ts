import { list, put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

interface UploadImageOptions {
  contentType?: string;
  dataUrl: string;
  fileName: string;
}

export interface BlobDiagnosticsResult {
  configured: boolean;
  message: string;
  ok: boolean;
  sampleCount?: number;
  samplePathname?: string | null;
}

const sanitizeFileName = (fileName: string) => {
  const cleaned = fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'dish-image';
};

const parseDataUrl = (dataUrl: string, fallbackContentType?: string) => {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('The uploaded image payload is not a valid data URL.');
  }

  const [, detectedContentType, base64Payload] = match;
  const contentType = fallbackContentType || detectedContentType;
  return {
    buffer: Buffer.from(base64Payload, 'base64'),
    contentType,
  };
};

export const uploadMenuImageToBlob = async ({
  contentType,
  dataUrl,
  fileName,
}: UploadImageOptions) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
  }

  const { buffer, contentType: detectedContentType } = parseDataUrl(dataUrl, contentType);
  const pathname = `menu-images/${Date.now()}-${randomUUID()}-${sanitizeFileName(fileName)}`;
  const blob = await put(pathname, buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: detectedContentType,
  });

  return blob.url;
};

export const getBlobDiagnostics = async (): Promise<BlobDiagnosticsResult> => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      configured: false,
      ok: false,
      message: 'BLOB_READ_WRITE_TOKEN is not configured.',
    };
  }

  const result = await list({
    limit: 1,
    prefix: 'menu-images/',
  });

  return {
    configured: true,
    ok: true,
    message: 'Blob storage is reachable.',
    sampleCount: result.blobs.length,
    samplePathname: result.blobs[0]?.pathname ?? null,
  };
};
