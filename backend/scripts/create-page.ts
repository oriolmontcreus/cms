import enquirer from 'enquirer';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface PageConfig {
    title: string;
    slug: string;
}

//TODO: THIS ISNT WORKING CURRENTLY
async function updatePageRegistry(slug: string) {
    const registryPath = join(process.cwd(), '..', 'cms', 'src', 'lib', 'page-registry.ts');
    
    try {
        const registryContent = await readFile(registryPath, 'utf-8');
        
        // Add import for the new page
        const importLine = `import { config as ${slug}Config } from '../pages/${slug}';`;
        const updatedImports = registryContent.replace(
            /(\/\/ Import all page configurations\n)/,
            `$1${importLine}\n`
        );
        
        // Add to page configs object
        const configEntry = `    '${slug}': ${slug}Config,`;
        const updatedRegistry = updatedImports.replace(
            /(const pageConfigs: Record<string, PageConfig> = {\n)/,
            `$1${configEntry}\n`
        );
        
        await writeFile(registryPath, updatedRegistry);
        console.log('✅ Updated page registry');
    } catch (error) {
        console.error('❌ Error updating page registry:', error);
        console.log('💡 Please manually add the page to src/lib/page-registry.ts');
    }
}

async function createPage() {
    // Get basic page info
    const response = await enquirer.prompt<{ title: string; slug: string }>([
        {
            type: 'input',
            name: 'title',
            message: 'What is the title of your page?',
            validate: (value: string) => {
                if (!value) return 'Title is required';
                return true;
            }
        },
        {
            type: 'input',
            name: 'slug',
            message: 'What is the slug for the page URL? (e.g., "about" for /about)',
            validate: (value: string) => {
                if (!value) return 'Slug is required';
                if (!/^[a-z0-9-]+$/.test(value)) {
                    return 'Slug must contain only lowercase letters, numbers, and hyphens';
                }
                return true;
            }
        }
    ]);

    // Create the pages directory if it doesn't exist
    const pagesDir = join(process.cwd(), '..', 'cms', 'src', 'pages');
    await mkdir(pagesDir, { recursive: true });

    // Create the page configuration file
    const pageConfig: PageConfig = {
        title: response.title,
        slug: response.slug
    };

    const pageConfigPath = join(pagesDir, `${response.slug}.ts`);
    const configContent = `import type { PageConfig } from '../lib/components/form-builder/types';

export const config: PageConfig = {
    title: "${pageConfig.title}",
    slug: "${pageConfig.slug}",
    components: []
};
`;

    await writeFile(pageConfigPath, configContent);

    // Update the page registry
    await updatePageRegistry(response.slug);

    console.log(`✅ Page "${response.title}" created successfully!`);
    console.log(`🔗 Configuration file created at: ${pageConfigPath}`);
    console.log('💡 Use the create-component script to add form components to this page.');
    console.log('🚀 The page will be automatically available in your CMS after restart.');
}

createPage().catch(error => {
    if (error instanceof Error && error.message === 'canceled') {
        console.log('❌ Page creation cancelled');
        return;
    }
    console.error('❌ Error creating page:', error);
}); 