import { Context } from "hono";
import { PageService } from "@/src/services/page.service.js";
import BadRequest from "@/errors/BadRequest.js";
import NotFound from "@/errors/NotFound.js";

export class PageController {
  static async createPage(c: Context) {
      const body = await c.req.json();
      
      if (!body.title || !body.slug) {
        throw new BadRequest("Title and slug are required");
      }

      const page = await PageService.createPage({
        title: body.title,
        slug: body.slug,
        config: body.config,
      });

      return c.json(page, 201);
  }

  static async getPages(c: Context) {
      const pages = await PageService.getPages();
      return c.json(pages);
  }

  static async getPageBySlug(c: Context) {
      const slug = c.req.param("slug");
      const page = await PageService.getPageBySlug(slug);
      
      if (!page) {
        throw new NotFound("Page not found");
      }

      return c.json(page);
  }

  static async updatePage(c: Context) {
      const slug = c.req.param("slug");
      const body = await c.req.json();
      
      const page = await PageService.updatePage(slug, body);
      return c.json(page);
  }

  static async saveFormData(c: Context) {
      const slug = c.req.param("slug");
      const body = await c.req.json();
      
      if (!body.formData) {
        throw new BadRequest("Form data is required");
      }

      const page = await PageService.saveFormData(slug, body.formData);
      return c.json(page);
  }
} 