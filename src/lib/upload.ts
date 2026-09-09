import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/** Allowed image MIME types and their extensions. */
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Maximum upload size per file: 5 MB. */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export type UploadResult = {
  url: string; // path relative to the web root, usable in <img src>
  filename: string;
};

export type UploadError = {
  error: string;
};

/**
 * Validate then save an uploaded file under /public/uploads.
 *
 * The storage layer is abstracted so it can later be swapped for
 * Cloudinary / S3 without changing calling code.
 *
 * `buffer` is the raw file bytes and `mime` is the detected MIME type.
 */
export async function saveUpload(
  buffer: Buffer,
  mime: string,
  suggestedName: string
): Promise<UploadResult | UploadError> {
  // MIME type validation
  if (!ALLOWED.has(mime)) {
    return { error: 'Only image files (jpeg, png, webp, gif) are allowed.' };
  }

  // Size validation
  if (buffer.length > MAX_FILE_SIZE) {
    return { error: 'File is too large. Maximum size is 5 MB.' };
  }

  // Generate a safe, unique filename while keeping the original extension.
  const ext = path.extname(suggestedName || '').toLowerCase();
  const safeExt = ext || (mime === 'image/jpeg' ? '.jpg' : '.png');
  const filename = `${randomUUID()}${safeExt}`;

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch {
    /* directory may already exist */
  }

  const fullPath = path.join(uploadsDir, filename);
  await fs.writeFile(fullPath, buffer);

  // `/uploads/<filename>` is served statically by Next.js from /public.
  return { url: `/uploads/${filename}`, filename };
}

/**
 * Remove an uploaded file from disk. Safe to call on a missing file.
 */
export async function deleteUpload(url: string): Promise<void> {
  try {
    const file = path.join(process.cwd(), 'public', url);
    await fs.unlink(file);
  } catch {
    /* ignore - file may not exist */
  }
}

