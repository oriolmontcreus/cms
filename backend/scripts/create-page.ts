import enquirer from 'enquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { logStep, printHeader, printSuccessBox, printErrorBox, printWarningBox, printInfoBox, printCancelledBox, handleScriptError } from './utils/terminal-ui.js';

interface PageConfig {
    title: string;
    slug: string;
}

async function updatePageRegistry(slug: string) {
    const registryPath = join(process.cwd(), '..', 'cms', 'src', 'lib', 'page-registry.ts');

    logStep('Updating page registry...');
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
        } else {
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
        logStep('Page registry updated successfully', 'success');
    } catch (error) {
        logStep('Error updating page registry', 'error');
        printWarningBox(
            'Manual Update Required',
            chalk.white('Please manually add the following to src/lib/page-registry.ts:') + '\n\n' +
            chalk.cyan(`Import: `) + chalk.gray(`import { config as ${slug.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Config } from '../pages/${slug}';`) + '\n' +
            chalk.cyan(`Config: `) + chalk.gray(`'${slug}': ${slug.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Config,`)
        );
    }
}

async function createPage() {
    printHeader('PAGE CREATION WIZARD', 'magenta');

    try {
        // Helper function to convert title to slug
        const titleToSlug = (title: string): string => {
            return title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        };

        // Get basic page info with enhanced prompts
        const titleResponse = await enquirer.prompt<{ title: string }>({
            type: 'input',
            name: 'title',
            message: chalk.cyan('What is the title of your page?'),
            validate: (value: string) => {
                if (!value.trim()) return chalk.red('Title is required');
                if (value.trim().length < 2) return chalk.red('Title must be at least 2 characters long');
                return true;
            },
            result: (value: string) => value.trim()
        });

        const suggestedSlug = titleToSlug(titleResponse.title);

        const slugResponse = await enquirer.prompt<{ slug: string }>({
            type: 'input',
            name: 'slug',
            message: chalk.cyan('What is the slug for the page URL? (e.g., "about" for /about)'),
            initial: suggestedSlug,
            validate: (value: string) => {
                if (!value.trim()) return chalk.red('Slug is required');
                if (!/^[a-z0-9-]+$/.test(value.trim())) {
                    return chalk.red('Slug must contain only lowercase letters, numbers, and hyphens');
                }
                if (value.trim().length > 50) return chalk.red('Slug is too long (max 50 characters)');
                return true;
            },
            result: (value: string) => value.trim().toLowerCase()
        });

        const response = {
            title: titleResponse.title,
            slug: slugResponse.slug
        };

        // Create the pages directory if it doesn't exist first
        const pagesDir = join(process.cwd(), '..', 'src', 'pages');
        await mkdir(pagesDir, { recursive: true });

        // Check if page already exists
        const pageConfigPath = join(pagesDir, `${response.slug}.ts`);
        try {
            await readFile(pageConfigPath, 'utf-8');
            printErrorBox(
                'Page already exists',
                chalk.yellow(`A page with slug "${response.slug}" already exists at:` + '\n' +
                    chalk.gray(pageConfigPath))
            );
            process.exit(1);
        } catch (error) {
            // File doesn't exist, which is what we want
        }

        // Show confirmation with beautiful table
        console.log('\n' + chalk.cyan.bold('Page creation summary'));

        const summaryTable = new Table({
            colWidths: [15, 80],
            style: {
                border: ['gray']
            }
        });

        summaryTable.push(
            [chalk.blue('Title'), chalk.bold(response.title)],
            [chalk.blue('Slug'), chalk.bold(response.slug)],
            [chalk.blue('URL'), chalk.cyan(`/pages/${response.slug}`)],
            [chalk.blue('File path'), chalk.gray(`src/pages/${response.slug}.ts`)]
        );

        console.log(summaryTable.toString());

        const confirmCreation = await enquirer.prompt<{ confirm: boolean }>({
            type: 'confirm',
            name: 'confirm',
            message: chalk.cyan('Proceed with page creation?'),
            initial: true
        });

        if (!confirmCreation.confirm) {
            printCancelledBox('Page creation cancelled');
            return;
        }

        // Create the pages directory if it doesn't exist
        logStep('Creating pages directory...');
        await mkdir(pagesDir, { recursive: true });
        logStep('Pages directory ready', 'success');

        // Create the page configuration file
        logStep('Creating page configuration file...');
        const pageConfig: PageConfig = {
            title: response.title,
            slug: response.slug
        };

        const configContent = `import type { PageConfig } from '../lib/components/form-builder/types';

export const config: PageConfig = {
    title: "${pageConfig.title}",
    slug: "${pageConfig.slug}",
    components: []
};
`;

        await writeFile(pageConfigPath, configContent);
        logStep('Page configuration file created', 'success');

        // Update the page registry AFTER creating the page file
        await updatePageRegistry(response.slug);

        // Success message with beautiful table
        const detailsTable = new Table({
            colWidths: [15, 80],
            style: {
                border: ['gray']
            }
        });

        detailsTable.push(
            [chalk.blue('Title'), response.title],
            [chalk.blue('Slug'), response.slug],
            [chalk.blue('File'), chalk.gray(pageConfigPath)],
            [chalk.blue('Registry'), chalk.green('Updated')],
            [chalk.blue('Status'), chalk.green('Ready to use')]
        );

        printSuccessBox('Page created successfully!', detailsTable.toString());

        printInfoBox(
            'Next steps:',
            chalk.white('1. Use the ') + chalk.yellow('create-component') + chalk.white(' script to add form components to this page') + '\n' +
            chalk.white('2. Restart your CMS to see the new page in the interface') + '\n' +
            chalk.white('3. Visit ') + chalk.cyan(`/pages/${response.slug}`) + chalk.white(' in your CMS')
        );

    } catch (error) {
        if (error instanceof Error && error.message === 'canceled') {
            printCancelledBox('Page creation cancelled by user');
        } else {
            printErrorBox('Error creating page', String(error));
        }
    }
}

// Handle command line execution with enhanced error handling
createPage().catch(error => handleScriptError(error, 'Page creation'));

export { createPage }; 