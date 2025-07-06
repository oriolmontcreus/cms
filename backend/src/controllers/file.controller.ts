import { Context } from "hono";
import * as fileService from "@/src/services/file.service.js";
import BadRequest from "@/errors/BadRequest.js";

export class FileController {
  async upload(c: Context) {
    const body = await c.req.parseBody();
    
    const files: File[] = [];
    
    for (const [key, value] of Object.entries(body)) {
      if (value instanceof File) {
        files.push(value);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (item instanceof File) files.push(item);
        }
      }
    }

    if (files.length === 0) {
      throw new BadRequest("No files found in request");
    }

    const uploadedFiles = await fileService.uploadFiles(files);
    
    return c.json({
      success: true,
      data: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    }, 200);
  }

  async delete(c: Context) {
    const body = await c.req.json();
    
    const { fileNames, fileIds } = body;
    
    // Accept either fileNames or fileIds
    const filesToDelete = fileNames || fileIds;
    
    if (!filesToDelete || !Array.isArray(filesToDelete)) throw new BadRequest("fileNames or fileIds array is required");

    const result = await fileService.deleteFiles(filesToDelete);
    
    const hasErrors = result.errors.length > 0;
    const statusCode = hasErrors ? (result.deletedFiles.length > 0 ? 207 : 400) : 200;
    
    return c.json({
      success: !hasErrors || result.deletedFiles.length > 0,
      data: result,
      message: hasErrors 
        ? `Deleted ${result.deletedFiles.length} file(s), ${result.errors.length} error(s)`
        : `Successfully deleted ${result.deletedFiles.length} file(s)`
    }, statusCode);
  }

  async checkExists(c: Context) {
    const body = await c.req.json();
    const { fileNames } = body;
    
    if (!fileNames || !Array.isArray(fileNames)) throw new BadRequest("fileNames array is required");

    const result = fileService.checkFilesExist(fileNames);
    
    return c.json({
      success: true,
      data: result
    }, 200);
  }
} 