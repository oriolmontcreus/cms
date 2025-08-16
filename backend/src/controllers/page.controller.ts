import { Context } from "hono";
import { PageService } from "@/src/services/page.service.js";
import BadRequest from "@/errors/BadRequest.js";

export class PageController {

  static async updateComponents(c: Context) {
    const slug = c.req.param("slug");
    const body = await c.req.json();

    if (!body.components) throw new BadRequest("Components are required");

    const page = await PageService.updateComponents(slug, body.components);
    return c.json(page, 200);
  }
} 