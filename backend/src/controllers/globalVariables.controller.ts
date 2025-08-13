import { Context } from 'hono';
import { promises as fs } from 'fs';
import path from 'path';
import { log } from '@/lib/log.js';

// Write to the site's data directory so it can be read statically
const GLOBAL_VARIABLES_FILE = path.join(process.cwd(), '..', 'site', 'src', 'data', 'globalVariables.json');

interface GlobalVariables {
    siteName?: string;
    siteDescription?: string;
    siteUrl?: string;
    contactEmail?: string;
    metaDescription?: string;
    metaKeywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    maxContentWidth?: number;
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    enableCookieConsent?: boolean;
    customTrackingCode?: string;
    updatedAt?: string;
    translations?: Record<string, any>;
}

// Ensure the data directory exists
async function ensureDataDirectory() {
    const dataDir = path.dirname(GLOBAL_VARIABLES_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

export class GlobalVariablesController {
    // Update global variables
    static async updateGlobalVariables(c: Context) {
        try {
            log('INFO', 'Updating global variables...');

            await ensureDataDirectory();

            const body = await c.req.json();
            const globalVariables: GlobalVariables = {
                ...body,
                updatedAt: new Date().toISOString()
            };

            await fs.writeFile(GLOBAL_VARIABLES_FILE, JSON.stringify(globalVariables, null, 2));

            return c.json({ message: 'Global variables updated successfully', data: globalVariables });
        } catch (error) {
            console.error('Error updating global variables:', error);
            return c.json({ error: 'Failed to update global variables' }, 500);
        }
    }
}
