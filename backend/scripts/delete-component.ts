import enquirer from 'enquirer';
import chalk from 'chalk';
import { unlink, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
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

        // Confirm deletion
        const { confirmDeletion } = await enquirer.prompt<{ confirmDeletion: boolean }>({
            type: 'confirm',
            name: 'confirmDeletion',
            message: chalk.red(`Are you sure you want to delete ${componentsToDelete.length} component(s)? This action cannot be undone.`),
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

        printSuccessBox(
            '✅ Components deleted successfully!',
            `Deleted ${componentsToDelete.length} component(s):\n${componentsToDelete.map(name => `- ${name}`).join('\n')}`
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

// Handle command line execution
deleteComponent().catch(error => handleScriptError(error, 'Component deletion'));
