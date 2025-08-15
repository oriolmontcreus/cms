import fs from "fs/promises";
import path from "path";
import { SITE_DIRECTORY_NAME } from "@shared/env.js";
import { log } from "@/lib/log.js";

const getExistingGlobalVariablesData = async (): Promise<Record<string, any>> => {
    try {
        const projectRoot = path.join(process.cwd(), '../../');
        const globalVariablesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/globalVariables.json');
        const data = await fs.readFile(globalVariablesFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        log('INFO', 'No existing globalVariables.json found, starting fresh');
        return {};
    }
};

const saveGlobalVariablesData = async (globalVariables: Record<string, any>): Promise<void> => {
    const projectRoot = path.join(process.cwd(), '../../');
    const globalVariablesFile = path.join(projectRoot, SITE_DIRECTORY_NAME, 'src/data/globalVariables.json');

    // Ensure the data directory exists
    const dataDir = path.dirname(globalVariablesFile);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }

    await fs.writeFile(globalVariablesFile, JSON.stringify(globalVariables, null, 2), 'utf-8');
};

export class GlobalVariablesService {
    static async getGlobalVariables(): Promise<Record<string, any>> {
        return await getExistingGlobalVariablesData();
    }

    static async updateGlobalVariables(data: Record<string, any>): Promise<Record<string, any>> {
        const globalVariables = {
            ...data,
            updatedAt: new Date().toISOString()
        };

        await saveGlobalVariablesData(globalVariables);
        log('INFO', `Updated global variables successfully`);
        return globalVariables;
    }
}
