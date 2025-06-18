import { Context } from "hono";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import type { Page } from "@shared/types/pages.js";

const execAsync = promisify(exec);

export class BuildController {
    static async triggerBuild(c: Context) {
        try {
            const page = await c.req.json<Page>();
            
            // Path to store our pages data
            const pagesDir = path.join(process.cwd(), '../astro-site/src/data');
            const pagesFile = path.join(pagesDir, 'pages.json');
            
            // Ensure the data directory exists
            await fs.mkdir(pagesDir, { recursive: true });
            
            // Read existing pages or create empty array
            let pages: Page[] = [];
            try {
                const existing = await fs.readFile(pagesFile, 'utf-8');
                pages = JSON.parse(existing);
            } catch (error) {
                // File doesn't exist or is invalid, start with empty array
            }

            // Update or add the new page
            const pageIndex = pages.findIndex(p => p.slug === page.slug);
            if (pageIndex >= 0) {
                pages[pageIndex] = page;
            } else {
                pages.push(page);
            }

            // Save the updated pages data
            await fs.writeFile(pagesFile, JSON.stringify(pages, null, 2), 'utf-8');

            // Run the Astro build
            const { stdout, stderr } = await execAsync('npm run build', {
                cwd: path.join(process.cwd(), '../astro-site')
            });

            console.log('Build output:', stdout);
            if (stderr) console.error('Build errors:', stderr);

            return c.json({ message: 'Build completed successfully' });
        } catch (error) {
            console.error('Build error:', error);
            throw error;
        }
    }
} 