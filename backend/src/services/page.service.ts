import { Page, ComponentInstance } from "@shared/types/pages.js";
import { IPageDocument, PageModel } from "@/src/models/page.model.js";
import fs from "fs/promises";
import path from "path";

export type CreatePagePayload = {
  title: string;
  slug: string;
  config?: Record<string, any>;
  components?: ComponentInstance[];
};

export type UpdatePagePayload = {
  content?: string;
  config?: Record<string, any>;
  components?: ComponentInstance[];
};

const toPageDTO = (doc: IPageDocument): Page => {
  // Convert formData to components if components array is empty but formData exists
  let components = doc.components || [];
  
  if (components.length === 0 && doc.formData && Object.keys(doc.formData).length > 0) {
    components = Object.entries(doc.formData).map(([instanceId, formData]) => {
      // Infer component name from instanceId or formData structure
      let componentName = 'Hero'; // Default fallback
      
      if (instanceId.includes('hero')) {
        componentName = 'Hero';
      } else if (instanceId.includes('contact')) {
        componentName = 'ContactForm';
      } else if (instanceId.includes('profile')) {
        componentName = 'UserProfile';
      }
      
      return {
        componentName,
        instanceId,
        displayName: instanceId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        formData: formData as Record<string, any>
      };
    });
  }

  return {
    _id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    content: doc.content,
    config: doc.config,
    components,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
};

// Helper function to update the JSON file
const updateJsonFile = async (): Promise<void> => {
  try {
    const projectRoot = path.join(process.cwd(), '../../');
    const pagesDir = path.join(projectRoot, 'astro-site/src/data');
    const pagesFile = path.join(pagesDir, 'pages.json');
    
    // Ensure the data directory exists
    await fs.mkdir(pagesDir, { recursive: true });
    
    // Get all pages from database
    const pages = await PageModel.find().sort({ createdAt: -1 });
    const pagesData = pages.map(toPageDTO);
    
    // Save the pages data to JSON file
    await fs.writeFile(pagesFile, JSON.stringify(pagesData, null, 2), 'utf-8');
    console.log(`✅ Updated pages.json with ${pagesData.length} pages`);
  } catch (error) {
    console.error('Error updating JSON file:', error);
    throw error;
  }
};

export class PageService {
  static async createPage(payload: CreatePagePayload): Promise<Page> {
    const page = await PageModel.create(payload);
    await updateJsonFile();
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

    await updateJsonFile();
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

    await updateJsonFile();
    return toPageDTO(page);
  }

  static async updateComponents(slug: string, components: ComponentInstance[]): Promise<Page> {
    const page = await PageModel.findOneAndUpdate(
      { slug },
      { $set: { components } },
      { new: true }
    );
    
    if (!page) {
      throw new Error("Page not found");
    }

    await updateJsonFile();
    return toPageDTO(page);
  }

  static async updateComponentFormData(slug: string, instanceId: string, formData: Record<string, any>): Promise<Page> {
    const page = await PageModel.findOneAndUpdate(
      { slug, "components.instanceId": instanceId },
      { $set: { "components.$.formData": formData } },
      { new: true }
    );
    
    if (!page) {
      throw new Error("Page or component instance not found");
    }

    await updateJsonFile();
    return toPageDTO(page);
  }
} 