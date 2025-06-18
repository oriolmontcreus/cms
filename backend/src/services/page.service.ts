import { IPage, PageModel } from "@/src/models/page.model.js";

export type CreatePagePayload = {
  title: string;
  slug: string;
};

export class PageService {
  static async createPage(payload: CreatePagePayload): Promise<IPage> {
      const page = await PageModel.create(payload);
      return page.toJSON() as IPage;
  }
} 