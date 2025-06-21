import { Page, Component } from "@shared/types/pages.js";
import fs from "fs/promises";
import path from "path";
import { SITE_DIRECTORY_NAME } from "@shared/env.js";

export type CreatePagePayload = {
  title: string;
  slug: string;
  config?: Record<string, any>;
  components?: Component[];
};

export type UpdatePagePayload = {
  content?: string;
  config?: Record<string, any>;
  components?: Component[];
};

// Helper function to get existing pages.json data
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
  /**
   * Get the path to the CMS source directory
   */
  private static getCmsSourcePath(): string {
    return path.join(process.cwd(), '../src');
  }

  /**
   * Get the path to a page configuration file
   */
  private static getPageConfigPath(slug: string): string {
    return path.join(this.getCmsSourcePath(), 'pages', `${slug}.ts`);
  }

  /**
   * Import and evaluate a page configuration dynamically
   */
  private static async importPageConfig(slug: string): Promise<any> {
    const configPath = this.getPageConfigPath(slug);
    
    // Check if file exists
    try {
      await fs.access(configPath);
    } catch {
      return null;
    }

    // Import the configuration
    const configModule = await import(`file://${configPath}?t=${Date.now()}`);
    return configModule.config;
  }

  /**
   * Get all available page slugs from the page-registry
   */
  private static async getAllPageSlugs(): Promise<string[]> {
    const registryPath = path.join(this.getCmsSourcePath(), 'lib/page-registry.ts');
    const registryModule = await import(`file://${registryPath}?t=${Date.now()}`);
    return registryModule.getAllPageSlugs();
  }

  /**
   * Convert page configuration to Page DTO format - SAME STRUCTURE AS BEFORE
   * Merge with existing data from pages.json
   */
  private static async configToPageDTO(config: any, slug: string): Promise<Page> {
    // Get existing data
    const existingPages = await getExistingPagesData();
    const existingPage = existingPages.find(p => p.slug === slug);

    const components: Component[] = config.components.map((comp: any) => {
      // Find existing component data
      const existingComponent = existingPage?.components?.find(c => c.instanceId === comp.id);
      
      return {
        componentName: comp.component.name,
        instanceId: comp.id,
        displayName: comp.displayName || comp.component.name,
        formData: existingComponent?.formData || {}
      };
    });

    return {
      _id: slug,
      title: config.title,
      slug: config.slug,
      content: existingPage?.content || "",
      config: config,
      components: components,
      createdAt: existingPage?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static async createPage(payload: CreatePagePayload): Promise<Page> {
    // For now, this would require manual file creation
    throw new Error("Page creation not implemented - create pages manually in src/pages/");
  }

  static async getPages(): Promise<Page[]> {
    const slugs = await this.getAllPageSlugs();
    const pages: Page[] = [];

    for (const slug of slugs) {
      const config = await this.importPageConfig(slug);
      if (config) {
        pages.push(await this.configToPageDTO(config, slug));
      }
    }

    return pages;
  }

  static async getPageBySlug(slug: string): Promise<Page | null> {
    const config = await this.importPageConfig(slug);
    if (!config) return null;

    return await this.configToPageDTO(config, slug);
  }

  static async updatePage(slug: string, payload: UpdatePagePayload): Promise<Page> {
    throw new Error("Page updates not implemented - modify pages manually in src/pages/");
  }

  static async updateComponents(slug: string, components: Component[]): Promise<Page> {
    // Just update the pages.json directly - no need to update TypeScript files
    const existingPages = await getExistingPagesData();
    const pageIndex = existingPages.findIndex(p => p.slug === slug);
    
    if (pageIndex === -1) {
      throw new Error("Page not found");
    }

    // Update the components in the existing page
    existingPages[pageIndex].components = components;
    existingPages[pageIndex].updatedAt = new Date().toISOString();

    // Save back to pages.json
    const projectRoot = path.join(process.cwd(), '../../');
    const pagesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/pages.json');
    await fs.writeFile(pagesFile, JSON.stringify(existingPages, null, 2), 'utf-8');

    return existingPages[pageIndex];
  }

  static async updateComponentFormData(slug: string, instanceId: string, formData: Record<string, any>): Promise<Page> {
    // Just update the pages.json directly - no need to update TypeScript files
    const existingPages = await getExistingPagesData();
    const pageIndex = existingPages.findIndex(p => p.slug === slug);
    
    if (pageIndex === -1) {
      throw new Error("Page not found");
    }

    const componentIndex = existingPages[pageIndex].components.findIndex(c => c.instanceId === instanceId);
    if (componentIndex === -1) {
      throw new Error("Component not found");
    }

    // Update the component form data
    existingPages[pageIndex].components[componentIndex].formData = formData;
    existingPages[pageIndex].updatedAt = new Date().toISOString();

    // Save back to pages.json
    const projectRoot = path.join(process.cwd(), '../../');
    const pagesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/pages.json');
    await fs.writeFile(pagesFile, JSON.stringify(existingPages, null, 2), 'utf-8');

    return existingPages[pageIndex];
  }
} 