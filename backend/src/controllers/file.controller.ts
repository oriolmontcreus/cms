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
          if (item instanceof File) {
            files.push(item);
          }
        }
      }
    }

    if (files.length === 0) {
      throw new BadRequest("No files found in request");
    }

    const result = await fileService.uploadFiles(files);
    
    return c.json({
      success: true,
      data: result
    });
  }
} 