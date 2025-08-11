import enquirer from 'enquirer';
import chalk from 'chalk';
import { unlink, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { printHeader, logStep, printSuccessBox, handleScriptError } from './utils/terminal-ui.js';

async function deleteComponent() {
    printHeader('COMPONENT DELETION WIZARD', 'magenta');

    try {
        // Get all available components from the registry
        const componentsDir = join(process.cwd(), '..', 'cms', 'src', 'components');
        const registryPath = join(componentsDir, 'component-registry.ts');

        logStep('Reading component registry...');
        const registryContent = await readFile(registryPath, 'utf-8');

        // Extract component names from registry
        const componentNames = extractComponentNames(registryContent);

        if (componentNames.length === 0) {
            console.log(chalk.yellow('⚠️  No components found in the registry to delete.'));
            return;
        }

        logStep(`Found ${componentNames.length} components`, 'success');

        // Let user select components to delete
        const { componentsToDelete } = await enquirer.prompt<{ componentsToDelete: string[] }>({
            type: 'multiselect',
            name: 'componentsToDelete',
            message: chalk.cyan('Select components to delete (use spacebar to select, enter to confirm):'),
            choices: componentNames.map(name => ({ name, value: name }))
        });

        // Validate selection
        if (componentsToDelete.length === 0) {
            console.log(chalk.yellow('No components selected. Deletion cancelled.'));
            return;
        }

        // Scan pages for component usage
        logStep('Scanning pages for component usage...');
        const pagesDir = join(process.cwd(), '..', 'cms', 'src', 'pages');
        const affectedPages = await scanPagesForComponents(pagesDir, componentsToDelete);
        
        if (affectedPages.length > 0) {
            console.log(chalk.yellow('\n⚠️  Warning: The following pages use components that will be deleted:'));
            affectedPages.forEach(({ file, components }) => {
                console.log(chalk.yellow(`  📄 ${file}: ${components.join(', ')}`));
            });
            
            const { handlePages } = await enquirer.prompt<{ handlePages: string }>({
                type: 'select',
                name: 'handlePages',
                message: 'How would you like to handle the affected pages?',
                choices: [
                    { name: 'Automatically remove component references from pages', value: 'auto' },
                    { name: 'Cancel deletion (let me update pages manually)', value: 'cancel' }
                ]
            });

            if (handlePages === 'cancel') {
                console.log(chalk.yellow('Deletion cancelled. Please update the pages manually first.'));
                return;
            }
        }

        // Confirm deletion
        const { confirmDeletion } = await enquirer.prompt<{ confirmDeletion: boolean }>({
            type: 'confirm',
            name: 'confirmDeletion',
            message: chalk.red(`Are you sure you want to delete ${componentsToDelete.length} component(s)${affectedPages.length > 0 ? ` and update ${affectedPages.length} page(s)` : ''}? This action cannot be undone.`),
            initial: false
        });

        if (!confirmDeletion) {
            console.log(chalk.yellow('Deletion cancelled.'));
            return;
        }

        // Delete component files
        logStep('Deleting component files...');
        for (const componentName of componentsToDelete) {
            const componentPath = join(componentsDir, `${componentName}.ts`);
            try {
                await unlink(componentPath);
                logStep(`Deleted ${componentName}.ts`, 'success');
            } catch (error) {
                logStep(`Warning: Could not delete ${componentName}.ts (file may not exist)`, 'info');
            }
        }

        // Update component registry
        logStep('Updating component registry...');
        const updatedRegistryContent = updateComponentRegistry(registryContent, componentsToDelete);
        await writeFile(registryPath, updatedRegistryContent);
        logStep('Component registry updated', 'success');

        // Update affected pages
        if (affectedPages.length > 0) {
            logStep('Updating affected pages...');
            for (const { file, fullPath } of affectedPages) {
                await updatePageFile(fullPath, componentsToDelete);
                logStep(`Updated ${file}`, 'success');
            }
        }

        printSuccessBox(
            '✅ Components deleted successfully!',
            `Deleted ${componentsToDelete.length} component(s):\n${componentsToDelete.map(name => `- ${name}`).join('\n')}${affectedPages.length > 0 ? `\n\nUpdated ${affectedPages.length} page(s).` : ''}`
        );

    } catch (error) {
        handleScriptError(error, 'Component deletion');
    }
}

function extractComponentNames(registryContent: string): string[] {
    const componentNames: string[] = [];

    // Extract from COMPONENT_REGISTRY object
    const registryMatch = registryContent.match(/export const COMPONENT_REGISTRY[^{]*\{([^}]*)\}/s);
    if (registryMatch) {
        const registryBody = registryMatch[1];
        const entries = registryBody.match(/'([^']+)':\s*\w+/g);
        if (entries) {
            for (const entry of entries) {
                const nameMatch = entry.match(/'([^']+)':/);
                if (nameMatch) {
                    componentNames.push(nameMatch[1]);
                }
            }
        }
    }

    return componentNames;
}

function updateComponentRegistry(content: string, componentsToDelete: string[]): string {
    let updatedContent = content;

    // Remove imports for deleted components
    for (const componentName of componentsToDelete) {
        // Remove import statement
        const importRegex = new RegExp(`import\\s+\\{\\s*${componentName}\\s*\\}\\s+from\\s+[^;]+;\\s*\\n?`, 'g');
        updatedContent = updatedContent.replace(importRegex, '');

        // Also handle imports with multiple components on same line
        const multiImportRegex = new RegExp(`(import\\s+\\{[^}]*),\\s*${componentName}\\s*([^}]*\\}\\s+from[^;]+;)`, 'g');
        updatedContent = updatedContent.replace(multiImportRegex, '$1$2');

        const multiImportRegex2 = new RegExp(`(import\\s+\\{)\\s*${componentName}\\s*,([^}]*\\}\\s+from[^;]+;)`, 'g');
        updatedContent = updatedContent.replace(multiImportRegex2, '$1$2');

        // Remove from COMPONENT_REGISTRY object
        const registryEntryRegex = new RegExp(`\\s*'${componentName}':\\s*${componentName},?\\s*\\n?`, 'g');
        updatedContent = updatedContent.replace(registryEntryRegex, '');

        // Remove from export statement
        const exportRegex = new RegExp(`(export\\s+\\{[^}]*),\\s*${componentName}\\s*([^}]*\\})`, 'g');
        updatedContent = updatedContent.replace(exportRegex, '$1$2');

        const exportRegex2 = new RegExp(`(export\\s+\\{)\\s*${componentName}\\s*,([^}]*\\})`, 'g');
        updatedContent = updatedContent.replace(exportRegex2, '$1$2');
    }

    // Clean up any trailing commas or empty lines
    updatedContent = updatedContent.replace(/,(\s*[}\]])/g, '$1');
    updatedContent = updatedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    updatedContent = updatedContent.replace(/{\s*,/g, '{');
    updatedContent = updatedContent.replace(/,\s*}/g, ' }');

    return updatedContent;
}

interface AffectedPage {
    file: string;
    fullPath: string;
    components: string[];
}

async function scanPagesForComponents(pagesDir: string, componentsToDelete: string[]): Promise<AffectedPage[]> {
    const affectedPages: AffectedPage[] = [];
    
    async function scanDirectory(dir: string): Promise<void> {
        const entries = await readdir(dir);
        
        for (const entry of entries) {
            const fullPath = join(dir, entry);
            const stats = await stat(fullPath);
            
            if (stats.isDirectory()) {
                await scanDirectory(fullPath);
            } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
                try {
                    const content = await readFile(fullPath, 'utf-8');
                    const usedComponents = findComponentUsage(content, componentsToDelete);
                    
                    if (usedComponents.length > 0) {
                        const relativePath = fullPath.replace(pagesDir + '\\', '').replace(/\\/g, '/');
                        affectedPages.push({
                            file: relativePath,
                            fullPath,
                            components: usedComponents
                        });
                    }
                } catch (error) {
                    // Skip files that can't be read
                }
            }
        }
    }
    
    await scanDirectory(pagesDir);
    return affectedPages;
}

function findComponentUsage(content: string, componentsToDelete: string[]): string[] {
    const usedComponents: string[] = [];
    
    for (const componentName of componentsToDelete) {
        // Check for import statements (both direct and Component suffix)
        const importPatterns = [
            `import.*{.*${componentName}.*}.*from`,
            `import.*{.*${componentName}Component.*}.*from`
        ];
        
        // Check for usage in components array
        const usagePatterns = [
            `component:\\s*${componentName}\\b`,
            `component:\\s*${componentName}Component\\b`
        ];
        
        const allPatterns = [...importPatterns, ...usagePatterns];
        
        if (allPatterns.some(pattern => new RegExp(pattern).test(content))) {
            usedComponents.push(componentName);
        }
    }
    
    return usedComponents;
}

async function updatePageFile(filePath: string, componentsToDelete: string[]): Promise<void> {
    let content = await readFile(filePath, 'utf-8');
    
    for (const componentName of componentsToDelete) {
        // Remove import statements
        const importPatterns = [
            new RegExp(`import\\s+\\{[^}]*\\b${componentName}\\b[^}]*\\}\\s+from\\s+[^;]+;\\s*\\n?`, 'g'),
            new RegExp(`import\\s+\\{[^}]*\\b${componentName}Component\\b[^}]*\\}\\s+from\\s+[^;]+;\\s*\\n?`, 'g')
        ];
        
        for (const pattern of importPatterns) {
            content = content.replace(pattern, '');
        }
        
        // Handle multiple imports on same line
        const multiImportPatterns = [
            new RegExp(`(import\\s+\\{[^}]*),\\s*\\b${componentName}\\b\\s*([^}]*\\}\\s+from[^;]+;)`, 'g'),
            new RegExp(`(import\\s+\\{)\\s*\\b${componentName}\\b\\s*,([^}]*\\}\\s+from[^;]+;)`, 'g'),
            new RegExp(`(import\\s+\\{[^}]*),\\s*\\b${componentName}Component\\b\\s*([^}]*\\}\\s+from[^;]+;)`, 'g'),
            new RegExp(`(import\\s+\\{)\\s*\\b${componentName}Component\\b\\s*,([^}]*\\}\\s+from[^;]+;)`, 'g')
        ];
        
        for (const pattern of multiImportPatterns) {
            content = content.replace(pattern, '$1$2');
        }
        
        // Remove component objects from components array
        const componentObjectPatterns = [
            new RegExp(`\\s*\\{[^}]*component:\\s*${componentName}\\b[^}]*\\},?\\s*`, 'g'),
            new RegExp(`\\s*\\{[^}]*component:\\s*${componentName}Component\\b[^}]*\\},?\\s*`, 'g')
        ];
        
        for (const pattern of componentObjectPatterns) {
            content = content.replace(pattern, '');
        }
    }
    
    // Clean up any trailing commas or empty lines
    content = content.replace(/,(\s*\])/g, '$1'); // Remove trailing comma before closing array
    content = content.replace(/\[\s*,/g, '['); // Remove leading comma after opening array
    content = content.replace(/,\s*,/g, ','); // Remove double commas
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove excessive empty lines
    
    await writeFile(filePath, content);
}

// Handle command line execution
deleteComponent().catch(error => handleScriptError(error, 'Component deletion'));
