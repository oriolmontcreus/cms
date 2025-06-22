import { Page, Component } from "@shared/types/pages.type.js";
import fs from "fs/promises";
import path from "path";
import { SITE_DIRECTORY_NAME } from "@shared/env.js";

const getExistingPagesData = async (): Promise<Page[]> => {
  try {
    const projectRoot = path.join(process.cwd(), '../../');
    const pagesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/pages.json');
    const data = await fs.readFile(pagesFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No existing pages.json found, starting fresh');
    return [];
  }
};

export class PageService {

  static async updateComponents(slug: string, components: Component[]): Promise<Page> {
    const existingPages = await getExistingPagesData();
    const pageIndex = existingPages.findIndex((p: Page) => p.slug === slug);
    
    if (pageIndex === -1) {
      throw new Error("Page not found");
    }

    existingPages[pageIndex].components = components;
    existingPages[pageIndex].updatedAt = new Date().toISOString();

    const projectRoot = path.join(process.cwd(), '../../');
    const pagesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/pages.json');
    await fs.writeFile(pagesFile, JSON.stringify(existingPages, null, 2), 'utf-8');

    return existingPages[pageIndex];
  }

  static async updateComponentFormData(slug: string, instanceId: string, formData: Record<string, any>): Promise<Page> {
    const existingPages = await getExistingPagesData();
    const pageIndex = existingPages.findIndex((p: Page) => p.slug === slug);
    
    if (pageIndex === -1) {
      throw new Error("Page not found");
    }

    const componentIndex = existingPages[pageIndex].components.findIndex((c: Component) => c.instanceId === instanceId);
    if (componentIndex === -1) {
      throw new Error("Component not found");
    }

    existingPages[pageIndex].components[componentIndex].formData = formData;
    existingPages[pageIndex].updatedAt = new Date().toISOString();

    const projectRoot = path.join(process.cwd(), '../../');
    const pagesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/pages.json');
    await fs.writeFile(pagesFile, JSON.stringify(existingPages, null, 2), 'utf-8');

    return existingPages[pageIndex];
  }
} 