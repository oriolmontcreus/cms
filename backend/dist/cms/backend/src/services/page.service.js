import fs from "fs/promises";
import path from "path";
import { SITE_DIRECTORY_NAME } from "@shared/env.js";
import NotFound from "@/errors/NotFound.js";
import { log } from "@/lib/log.js";
const getExistingPagesData = async () => {
    try {
        const projectRoot = path.join(process.cwd(), '../../');
        const pagesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/pages.json');
        const data = await fs.readFile(pagesFile, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        log('INFO', 'No existing pages.json found, starting fresh');
        return [];
    }
};
const savePageData = async (pages) => {
    const projectRoot = path.join(process.cwd(), '../../');
    const pagesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/pages.json');
    await fs.writeFile(pagesFile, JSON.stringify(pages, null, 2), 'utf-8');
};
export class PageService {
    static async getPages() {
        return await getExistingPagesData();
    }
    static async updateComponents(slug, components) {
        const existingPages = await getExistingPagesData();
        const pageIndex = existingPages.findIndex((p) => p.slug === slug);
        if (pageIndex === -1) {
            throw new NotFound("Page not found");
        }
        existingPages[pageIndex].components = components;
        existingPages[pageIndex].updatedAt = new Date().toISOString();
        await savePageData(existingPages);
        return existingPages[pageIndex];
    }
    static async updateComponentFormData(slug, instanceId, formData) {
        const existingPages = await getExistingPagesData();
        const pageIndex = existingPages.findIndex((p) => p.slug === slug);
        if (pageIndex === -1) {
            throw new NotFound("Page not found");
        }
        const componentIndex = existingPages[pageIndex].components.findIndex((c) => c.instanceId === instanceId);
        if (componentIndex === -1) {
            throw new NotFound("Component not found");
        }
        existingPages[pageIndex].components[componentIndex].formData = formData;
        existingPages[pageIndex].updatedAt = new Date().toISOString();
        await savePageData(existingPages);
        return existingPages[pageIndex];
    }
}
