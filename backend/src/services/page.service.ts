import { Page, Component } from "@shared/types/pages.type.js";
import fs from "fs/promises";
import path from "path";
import { SITE_DIRECTORY_NAME } from "@shared/env.js";
import NotFound from "@/errors/NotFound.js";
import { log } from "@/lib/log.js";

const getExistingPagesData = async (): Promise<Page[]> => {
  try {
    const projectRoot = path.join(process.cwd(), '../../');
    const pagesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/pages.json');
    const data = await fs.readFile(pagesFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    log('INFO', 'No existing pages.json found, starting fresh');
    return [];
  }
};

const savePageData = async (pages: Page[]): Promise<void> => {
  const projectRoot = path.join(process.cwd(), '../../');
  const pagesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/pages.json');
  await fs.writeFile(pagesFile, JSON.stringify(pages, null, 2), 'utf-8');
};

export class PageService {
  static async getPages(): Promise<Page[]> {
    return await getExistingPagesData();
  }

  static async updateComponents(slug: string, components: Component[]): Promise<Page> {
    const existingPages = await getExistingPagesData();
    let pageIndex = existingPages.findIndex((p: Page) => p.slug === slug);

    if (pageIndex === -1) {
      // Create a new page if it doesn't exist
      const newPage: Page = {
        _id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: slug === '/' ? 'Home' : slug,
        slug: slug,
        content: '',
        config: {
          title: slug === '/' ? 'Home' : slug,
          slug: slug
        },
        components: components,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      existingPages.push(newPage);
      pageIndex = existingPages.length - 1;
      log('INFO', `Created new page with slug: ${slug}`);
    } else {
      existingPages[pageIndex].components = components;
      existingPages[pageIndex].updatedAt = new Date().toISOString();
    }

    await savePageData(existingPages);
    return existingPages[pageIndex];
  }

  static async updateComponentFormData(slug: string, instanceId: string, formData: Record<string, any>): Promise<Page> {
    const existingPages = await getExistingPagesData();
    const pageIndex = existingPages.findIndex((p: Page) => p.slug === slug);

    if (pageIndex === -1) {
      throw new NotFound("Page not found");
    }

    const componentIndex = existingPages[pageIndex].components.findIndex((c: Component) => c.instanceId === instanceId);
    if (componentIndex === -1) {
      throw new NotFound("Component not found");
    }

    existingPages[pageIndex].components[componentIndex].formData = formData;
    existingPages[pageIndex].updatedAt = new Date().toISOString();

    await savePageData(existingPages);
    return existingPages[pageIndex];
  }
} 