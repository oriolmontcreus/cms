import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES_PER_REQUEST, UPLOAD_DIR } from "@/constants/file.js";
import BadRequest from "@/errors/BadRequest.js";
import PayloadTooLarge from "@/errors/PayloadTooLarge.js";
import { UploadedFile } from "@shared/types/file.type.js";

export async function uploadFiles(files: File[]): Promise<void> {
  if (!files || files.length === 0) {
    throw new BadRequest("No files provided");
  }

  if (files.length > MAX_FILES_PER_REQUEST) {
    throw new BadRequest(`Maximum ${MAX_FILES_PER_REQUEST} files allowed per request`);
  }

  const uploadedFiles: UploadedFile[] = [];

  await ensureUploadDirectory();

  for (const file of files) {
    await validateFile(file);
    
    const uploadedFile = await processFile(file);
    uploadedFiles.push(uploadedFile);
  }
}

async function validateFile(file: File): Promise<void> {
  if (!file.name || file.name.trim() === "") {
    throw new BadRequest("File name is required");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new PayloadTooLarge(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    throw new BadRequest(`File type ${file.type} is not allowed`);
  }
}

async function processFile(file: File): Promise<UploadedFile> {
  const fileId = randomUUID();
  const fileExtension = path.extname(file.name);
  const fileName = `${fileId}${fileExtension}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const buffer = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(buffer));

  return {
    id: fileId,
    originalName: file.name,
    fileName,
    mimeType: file.type,
    size: file.size,
    path: filePath,
    uploadedAt: new Date()
  };
}

async function ensureUploadDirectory(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export function getFileUrl(fileName: string): string {
  return `/uploads/${fileName}`;
}

export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as any);
} 