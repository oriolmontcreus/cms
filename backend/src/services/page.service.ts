import { Page } from "@shared/types/pages.js";
import { IPageDocument, PageModel } from "@/src/models/page.model.js";

export type CreatePagePayload = {
  title: string;
  slug: string;
  config?: Record<string, any>;
};

export type UpdatePagePayload = {
  content?: string;
  formData?: Record<string, any>;
  config?: Record<string, any>;
};

const toPageDTO = (doc: IPageDocument): Page => ({
  _id: doc._id.toString(),
  title: doc.title,
  slug: doc.slug,
  content: doc.content,
  formData: doc.formData,
  config: doc.config,
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

  static async getPageBySlug(slug: string): Promise<Page | null> {
    const page = await PageModel.findOne({ slug });
    return page ? toPageDTO(page) : null;
  }

  static async updatePage(slug: string, payload: UpdatePagePayload): Promise<Page> {
    const page = await PageModel.findOneAndUpdate(
      { slug },
      { $set: payload },
      { new: true }
    );
    
    if (!page) {
      throw new Error("Page not found");
    }

    return toPageDTO(page);
  }

  static async saveFormData(slug: string, formData: Record<string, any>): Promise<Page> {
    const page = await PageModel.findOneAndUpdate(
      { slug },
      { $set: { formData } },
      { new: true }
    );
    
    if (!page) {
      throw new Error("Page not found");
    }

    return toPageDTO(page);
  }
} 