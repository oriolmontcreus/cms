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
    parentSlug?: string;
}

async function updatePageRegistry(slug: string, parentSlug?: string) {
    const registryPath = join(process.cwd(), 'src', 'lib', 'page-registry.ts');

    logStep('Updating page registry...');
    try {
        const registryContent = await readFile(registryPath, 'utf-8');

        // Convert slug to camelCase for the config variable name
        // For nested pages, we need to include the parent in the variable name
        const fullSlug = parentSlug ? `${parentSlug}/${slug}` : slug;
        const configVarName = fullSlug.replace(/[/-]/g, (match) => match === '/' ? '' : match).replace(/-([a-z])/g, (g) => g[1].toUpperCase()) + 'Config';

        const lines = registryContent.split('\n');
        let updatedLines = [...lines];

        // For nested pages, import from the nested directory structure
        const importPath = parentSlug ? `../pages/${parentSlug}/${slug}` : `../pages/${slug}`;
        const importLine = `import { config as ${configVarName} } from '${importPath}';`;
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

        // Find where to add the config entry - use full slug as key for nested pages
        const configKey = parentSlug ? `${parentSlug}/${slug}` : slug;
        const configEntry = `    '${configKey}': ${configVarName},`;
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
        const fullSlug = parentSlug ? `${parentSlug}/${slug}` : slug;
        const configVarName = fullSlug.replace(/[/-]/g, (match) => match === '/' ? '' : match).replace(/-([a-z])/g, (g) => g[1].toUpperCase()) + 'Config';
        const importPath = parentSlug ? `../pages/${parentSlug}/${slug}` : `../pages/${slug}`;

        printWarningBox(
            'Manual Update Required',
            chalk.white('Please manually add the following to src/lib/page-registry.ts:') + '\n\n' +
            chalk.cyan(`Import: `) + chalk.gray(`import { config as ${configVarName} } from '${importPath}';`) + '\n' +
            chalk.cyan(`Config: `) + chalk.gray(`'${fullSlug}': ${configVarName},`)
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

        // Ask if this is a child page
        const isChildPageResponse = await enquirer.prompt<{ isChild: boolean }>({
            type: 'confirm',
            name: 'isChild',
            message: chalk.cyan('Is this a child page of an existing page?'),
            initial: false
        });

        let parentSlug: string | undefined;

        if (isChildPageResponse.isChild) {
            // Get list of existing pages for parent selection
            try {
                const existingPages: string[] = [];

                // Read page registry to get existing pages
                const registryPath = join(process.cwd(), 'src', 'lib', 'page-registry.ts');
                const registryContent = await readFile(registryPath, 'utf-8');

                // Extract page slugs from the registry content
                const pageConfigRegex = /'([^']+)':\s*\w+Config/g;
                let match;
                while ((match = pageConfigRegex.exec(registryContent)) !== null) {
                    const slug = match[1];
                    // Only include top-level pages (no slashes) as potential parents
                    if (!slug.includes('/')) {
                        existingPages.push(slug);
                    }
                }

                if (existingPages.length === 0) {
                    printWarningBox(
                        'No Parent Pages Found',
                        chalk.white('No existing pages found to use as parent. Creating as top-level page.')
                    );
                } else {
                    const parentResponse = await enquirer.prompt<{ parent: string }>({
                        type: 'select',
                        name: 'parent',
                        message: chalk.cyan('Select the parent page:'),
                        choices: existingPages.map(page => ({
                            name: page,
                            value: page
                        }))
                    });
                    parentSlug = parentResponse.parent;
                }
            } catch (error) {
                printWarningBox(
                    'Could not read existing pages',
                    chalk.white('Unable to read existing pages. Creating as top-level page.')
                );
            }
        }

        const suggestedSlug = titleToSlug(titleResponse.title);

        const slugResponse = await enquirer.prompt<{ slug: string }>({
            type: 'input',
            name: 'slug',
            message: chalk.cyan(parentSlug
                ? `What is the slug for the child page? (will be ${parentSlug}/[slug])`
                : 'What is the slug for the page URL? (e.g., "about" for /about)'
            ),
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
            slug: slugResponse.slug,
            parentSlug
        };

        // Create the pages directory if it doesn't exist first
        const pagesDir = join(process.cwd(), 'src', 'pages');
        await mkdir(pagesDir, { recursive: true });

        // For nested pages, create the parent directory structure
        let pageConfigPath: string;
        let targetDir: string;

        if (response.parentSlug) {
            // Create nested structure: pages/parent/child.ts
            targetDir = join(pagesDir, response.parentSlug);
            await mkdir(targetDir, { recursive: true });
            pageConfigPath = join(targetDir, `${response.slug}.ts`);
        } else {
            // Create flat structure: pages/slug.ts
            targetDir = pagesDir;
            pageConfigPath = join(targetDir, `${response.slug}.ts`);
        }

        // Check if page already exists
        try {
            await readFile(pageConfigPath, 'utf-8');
            const fullSlug = response.parentSlug ? `${response.parentSlug}/${response.slug}` : response.slug;
            printErrorBox(
                'Page already exists',
                chalk.yellow(`A page with slug "${fullSlug}" already exists at:` + '\n' +
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

        const fullSlug = response.parentSlug ? `${response.parentSlug}/${response.slug}` : response.slug;
        const displayPath = response.parentSlug ? `src/pages/${response.parentSlug}/${response.slug}.ts` : `src/pages/${response.slug}.ts`;

        summaryTable.push(
            [chalk.blue('Title'), chalk.bold(response.title)],
            [chalk.blue('Slug'), chalk.bold(response.slug)],
            [chalk.blue('Parent'), response.parentSlug ? chalk.bold(response.parentSlug) : chalk.gray('None (top-level)')],
            [chalk.blue('Full URL'), chalk.cyan(`/pages/${fullSlug}`)],
            [chalk.blue('File path'), chalk.gray(displayPath)]
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
            slug: response.slug,
            parentSlug: response.parentSlug
        };

        // Determine correct import path based on nesting level
        const importPath = response.parentSlug ? '../../lib/components/form-builder/types' : '../lib/components/form-builder/types';

        const configContent = `import type { PageConfig } from '${importPath}';

export const config: PageConfig = {
    title: "${pageConfig.title}",
    slug: "${pageConfig.slug}",${pageConfig.parentSlug ? `\n    parentSlug: "${pageConfig.parentSlug}",` : ''}
    components: []
};
`;

        await writeFile(pageConfigPath, configContent);
        logStep('Page configuration file created', 'success');

        // Update the page registry AFTER creating the page file
        await updatePageRegistry(response.slug, response.parentSlug);

        // Success message with beautiful table
        const detailsTable = new Table({
            colWidths: [15, 80],
            style: {
                border: ['gray']
            }
        });

        const finalSlug = response.parentSlug ? `${response.parentSlug}/${response.slug}` : response.slug;

        detailsTable.push(
            [chalk.blue('Title'), response.title],
            [chalk.blue('Slug'), response.slug],
            [chalk.blue('Parent'), response.parentSlug || chalk.gray('None (top-level)')],
            [chalk.blue('Full Path'), finalSlug],
            [chalk.blue('File'), chalk.gray(pageConfigPath)],
            [chalk.blue('Registry'), chalk.green('Updated')],
            [chalk.blue('Status'), chalk.green('Ready to use')]
        );

        printSuccessBox('Page created successfully!', detailsTable.toString());

        printInfoBox(
            'Next steps:',
            chalk.white('1. Use the ') + chalk.yellow('create-component') + chalk.white(' script to add form components to this page') + '\n' +
            chalk.white('2. Restart your CMS to see the new page in the interface') + '\n' +
            chalk.white('3. Visit ') + chalk.cyan(`/pages/${finalSlug}`) + chalk.white(' in your CMS')
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