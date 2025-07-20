import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES_PER_REQUEST, UPLOAD_DIR } from "@/constants/file.js";
import BadRequest from "@/errors/BadRequest.js";
import PayloadTooLarge from "@/errors/PayloadTooLarge.js";
import NotFound from "@/errors/NotFound.js";
import { UploadedFile } from "@shared/types/file.type.js";
import { unlink, readdir } from "fs/promises";

export async function uploadFiles(files: File[]): Promise<UploadedFile[]> {
  if (!files || files.length === 0) throw new BadRequest("No files provided");
  if (files.length > MAX_FILES_PER_REQUEST) throw new BadRequest(`Maximum ${MAX_FILES_PER_REQUEST} files allowed per request`);

  const uploadedFiles: UploadedFile[] = [];

  await ensureUploadDirectory();

  for (const file of files) {
    await validateFile(file);
    const uploadedFile = await processFile(file);
    uploadedFiles.push(uploadedFile);
  }

  return uploadedFiles;
}

export async function deleteFiles(fileIdentifiers: string[]): Promise<{ deletedFiles: string[], errors: string[] }> {
  if (!fileIdentifiers || fileIdentifiers.length === 0) throw new BadRequest("No file identifiers provided");
  
  const deletedFiles: string[] = [];
  const errors: string[] = [];

  for (const identifier of fileIdentifiers) {
    try {
      const fileName = await resolveFileName(identifier);
      await deleteFile(fileName);
      deletedFiles.push(identifier);
    } catch (error) {
      if (error instanceof NotFound) {
        deletedFiles.push(identifier);
      } else {
        const errorMessage = error instanceof Error ? error.message : `Failed to delete ${identifier}`;
        errors.push(errorMessage);
      }
    }
  }

  return { deletedFiles, errors };
}

//region Helper functions
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
    url: `/uploads/${fileName}`,
    path: filePath, // For backward compatibility
    uploadedAt: new Date() // For display
  };
}

async function resolveFileName(identifier: string): Promise<string> {
  if (!identifier || identifier.trim() === "") {
    throw new BadRequest("File identifier is required");
  }

  const sanitizedIdentifier = path.basename(identifier);
  
  // If identifier contains a file extension, treat it as a filename
  if (path.extname(sanitizedIdentifier)) {
    return sanitizedIdentifier;
  }
  
  // Otherwise, treat it as a file ID and find the corresponding file
  await ensureUploadDirectory();
  const files = await readdir(UPLOAD_DIR);
  const matchingFile = files.find(file => file.startsWith(sanitizedIdentifier));
  
  if (!matchingFile) {
    throw new NotFound(`File with ID ${identifier} not found`);
  }
  
  return matchingFile;
}

async function deleteFile(fileName: string): Promise<void> {
  if (!fileName || fileName.trim() === "") {
    throw new BadRequest("File name is required");
  }

  // Sanitize file name to prevent directory traversal
  const sanitizedFileName = path.basename(fileName);
  const filePath = path.join(UPLOAD_DIR, sanitizedFileName);

  if (!existsSync(filePath)) {
    throw new NotFound(`File ${fileName} not found`);
  }

  await unlink(filePath);
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
//endregion