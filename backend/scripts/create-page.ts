import enquirer from 'enquirer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

interface PageConfig {
    title: string;
    slug: string;
}

async function createPageInDatabase(pageConfig: PageConfig) {
    const response = await fetch('http://localhost:3001/api/pages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: pageConfig.title,
            slug: pageConfig.slug,
            config: pageConfig
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to create page in database: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Page created in database:', result);
    return result;
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
    fields: []
};
`;

    await writeFile(pageConfigPath, configContent);

    // Create the page in the database
    await createPageInDatabase(pageConfig);

    console.log(`✅ Page "${response.title}" created successfully!`);
    console.log(`🔗 Configuration file created at: ${pageConfigPath}`);
    console.log('💡 Use the create-component script to add form components to this page.');
}

createPage().catch(error => {
    if (error instanceof Error && error.message === 'canceled') {
        console.log('❌ Page creation cancelled');
        return;
    }
    console.error('❌ Error creating page:', error);
}); 