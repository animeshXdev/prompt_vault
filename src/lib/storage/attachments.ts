import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import JSZip from "jszip";

const ALLOWED_EXTENSIONS = new Set([".txt", ".md", ".json", ".pdf", ".zip"]);
const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/json",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream", // Fallback for some markdown or zip uploads
]);

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function getUploadDirectory(): string {
  const customPath = process.env.UPLOAD_DIR || "./data/uploads";
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), customPath);
}

export async function ensureUploadDirectory(): Promise<string> {
  const dir = getUploadDirectory();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function sanitizeFilename(filename: string): string {
  // Prevent directory traversal and malicious characters
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function validateFileMetadata(filename: string, mimeType: string, size: number): { valid: boolean; error?: string } {
  if (size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File size exceeds limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB` };
  }

  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File type ${ext} is not allowed. Supported types: TXT, MD, JSON, PDF, ZIP` };
  }

  return { valid: true };
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<{ filename: string; originalName: string; mimeType: string; fileSize: number; storagePath: string }> {
  const validation = validateFileMetadata(originalFilename, mimeType, buffer.length);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const uploadDir = await ensureUploadDirectory();
  const safeOriginalName = sanitizeFilename(originalFilename);
  const ext = path.extname(safeOriginalName).toLowerCase();
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const storedFilename = `${Date.now()}-${randomSuffix}${ext}`;
  const absolutePath = path.join(uploadDir, storedFilename);

  // Path traversal guard
  if (!absolutePath.startsWith(uploadDir)) {
    throw new Error("Invalid file path detected");
  }

  await fs.writeFile(absolutePath, buffer);

  return {
    filename: storedFilename,
    originalName: safeOriginalName,
    mimeType,
    fileSize: buffer.length,
    storagePath: absolutePath,
  };
}

export async function readAttachmentBuffer(storagePath: string): Promise<Buffer> {
  const uploadDir = getUploadDirectory();
  const resolved = path.resolve(storagePath);
  if (!resolved.startsWith(uploadDir)) {
    throw new Error("Access denied: File outside permitted storage");
  }
  return await fs.readFile(resolved);
}

export async function deleteAttachmentFile(storagePath: string): Promise<void> {
  try {
    const uploadDir = getUploadDirectory();
    const resolved = path.resolve(storagePath);
    if (!resolved.startsWith(uploadDir)) {
      throw new Error("Access denied: File outside permitted storage");
    }
    await fs.unlink(resolved);
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      console.error("Failed to delete attachment from disk:", err);
    }
  }
}

export async function getAttachmentTextPreview(storagePath: string, mimeType: string): Promise<string | null> {
  const ext = path.extname(storagePath).toLowerCase();
  if (ext === ".txt" || ext === ".md" || ext === ".json") {
    const buf = await readAttachmentBuffer(storagePath);
    // Limit preview to first 50KB to keep UI snappy
    const text = buf.subarray(0, 50 * 1024).toString("utf-8");
    return text;
  }
  if (ext === ".zip") {
    const buf = await readAttachmentBuffer(storagePath);
    const zip = await JSZip.loadAsync(buf);
    const fileList: string[] = [];
    zip.forEach((relativePath) => {
      fileList.push(relativePath);
    });
    return `ZIP Archive Contents (${fileList.length} items):\n` + fileList.slice(0, 50).join("\n");
  }
  return null;
}
