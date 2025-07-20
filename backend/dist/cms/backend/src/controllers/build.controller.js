import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { PageService } from "@/src/services/page.service.js";
const execAsync = promisify(exec);
export class BuildController {
    static async triggerBuild(c) {
        const projectRoot = path.join(process.cwd(), '../../');
        const sitePath = path.join(projectRoot, 'site');
        console.log('🚀 Starting production build...');
        console.log('Building in:', sitePath);
        // Get pages count for logging
        const pages = await PageService.getPages();
        console.log(`📝 Building ${pages.length} pages`);
        // Run the Astro build (JSON file is already up to date)
        const { stdout, stderr } = await execAsync('npm run build', {
            cwd: sitePath,
            env: {
                ...process.env,
                NODE_ENV: 'production'
            }
        });
        console.log('Build output:', stdout);
        if (stderr)
            console.error('Build errors:', stderr);
        return c.json({
            message: 'Production build completed successfully',
            pagesBuilt: pages.length
        });
    }
    static async triggerSinglePageBuild(c) {
        const { slug } = c.req.param();
        // This could be used for incremental builds in the future
        // For now, we'll rebuild everything
        return await BuildController.triggerBuild(c);
    }
}
