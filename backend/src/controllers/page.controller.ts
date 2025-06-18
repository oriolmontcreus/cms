import { Context } from "hono";
import { PageService } from "@/src/services/page.service.js";
import BadRequest from "@/errors/BadRequest.js";

export class PageController {
  static async createPage(c: Context) {
      const body = await c.req.json();
      if (!body || !body.title || !body.slug) {
        throw new BadRequest("Title and slug are required");
      }
      const page = await PageService.createPage({
        title: body.title,
        slug: body.slug,
      });
      return c.json(page, 201);
  }
} 