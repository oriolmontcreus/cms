import enquirer from 'enquirer';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
async function updatePageRegistry(slug) {
    const registryPath = join(process.cwd(), '..', 'cms', 'src', 'lib', 'page-registry.ts');
    try {
        const registryContent = await readFile(registryPath, 'utf-8');
        // Convert slug to camelCase for the config variable name
        const configVarName = slug.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) + 'Config';
        const lines = registryContent.split('\n');
        let updatedLines = [...lines];
        // Find where to add the import (after the last import statement)
        const importLine = `import { config as ${configVarName} } from '../pages/${slug}';`;
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import { config as ') && lines[i].includes('Config }')) {
                lastImportIndex = i;
            }
        }
        if (lastImportIndex !== -1) {
            updatedLines.splice(lastImportIndex + 1, 0, importLine);
        }
        else {
            // Fallback: add after the comment line
            const commentIndex = lines.findIndex(line => line.includes('// Import all page configurations'));
            if (commentIndex !== -1) {
                updatedLines.splice(commentIndex + 1, 0, importLine);
            }
        }
        // Find where to add the config entry 
        const configEntry = `    [${configVarName}.slug]: ${configVarName},`;
        let configObjectEndIndex = -1;
        let lastConfigLineIndex = -1;
        // First, find the pageConfigs object and locate existing entries
        for (let i = 0; i < updatedLines.length; i++) {
            const line = updatedLines[i].trim();
            // Look for lines that contain config entries (format: 'key': configVar or [config.slug]: configVar)
            if ((line.includes("': ") || line.includes("]: ")) && line.includes("Config")) {
                lastConfigLineIndex = i;
                // Add comma if this line doesn't already have one and doesn't have a trailing comma on next line
                if (!line.endsWith(',') && i + 1 < updatedLines.length && updatedLines[i + 1].trim() !== ',') {
                    updatedLines[i] = updatedLines[i] + ',';
                }
                // Remove standalone comma on next line if it exists
                if (i + 1 < updatedLines.length && updatedLines[i + 1].trim() === ',') {
                    updatedLines.splice(i + 1, 1);
                }
            }
            // Find the closing brace of the pageConfigs object
            if (line === '};' && lastConfigLineIndex !== -1 && i > lastConfigLineIndex) {
                configObjectEndIndex = i;
                break;
            }
        }
        if (configObjectEndIndex !== -1) {
            updatedLines.splice(configObjectEndIndex, 0, configEntry);
        }
        const updatedContent = updatedLines.join('\n');
        await writeFile(registryPath, updatedContent);
        console.log('✅ Updated page registry');
    }
    catch (error) {
        console.error('❌ Error updating page registry:', error);
        console.log('💡 Please manually add the following to src/lib/page-registry.ts:');
        console.log(`   Import: import { config as ${slug.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Config } from '../pages/${slug}';`);
        console.log(`   Config: '${slug}': ${slug.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Config,`);
    }
}
async function createPage() {
    // Get basic page info
    const response = await enquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'What is the title of your page?',
            validate: (value) => {
                if (!value)
                    return 'Title is required';
                return true;
            }
        },
        {
            type: 'input',
            name: 'slug',
            message: 'What is the slug for the page URL? (e.g., "about" for /about)',
            validate: (value) => {
                if (!value)
                    return 'Slug is required';
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
    const pageConfig = {
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
    console.log(`✅ Page configuration file created at: ${pageConfigPath}`);
    // Update the page registry AFTER creating the page file
    await updatePageRegistry(response.slug);
    console.log(`✅ Page "${response.title}" created successfully!`);
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
