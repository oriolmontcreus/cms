import { Page } from "@shared/types/pages.js";
import { IPageDocument, PageModel } from "@/src/models/page.model.js";

export type CreatePagePayload = {
  title: string;
  slug: string;
};

const toPageDTO = (doc: IPageDocument): Page => ({
  _id: doc._id.toString(),
  title: doc.title,
  slug: doc.slug,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString()
});

export class PageService {
  static async createPage(payload: CreatePagePayload): Promise<Page> {
    const page = await PageModel.create(payload);
    return toPageDTO(page);
  }

  static async getPages(): Promise<Page[]> {
    const pages = await PageModel.find().sort({ createdAt: -1 });
    return pages.map(toPageDTO);
  }
} 