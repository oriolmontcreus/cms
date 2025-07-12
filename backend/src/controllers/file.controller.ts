import { Context } from "hono";
import * as fileService from "@/src/services/file.service.js";
import BadRequest from "@/errors/BadRequest.js";

export class FileController {
  async upload(c: Context) {
    const body = await c.req.parseBody();
    
    const files: File[] = [];
    
    for (const [_, value] of Object.entries(body)) {
      if (value instanceof File) {
        files.push(value);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (item instanceof File) files.push(item);
        }
      }
    }

    if (files.length === 0) throw new BadRequest("No files found in request");

    const uploadedFiles = await fileService.uploadFiles(files);
    
    return c.json({
      success: true,
      data: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    }, 200);
  }

  async delete(c: Context) {
    const body = await c.req.json();
    
    const { fileIds } = body;
    if (!fileIds || !Array.isArray(fileIds)) throw new BadRequest("No File IDs provided");

    const result = await fileService.deleteFiles(fileIds);
    
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
} 