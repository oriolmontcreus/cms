import enquirer from 'enquirer';
import chalk from 'chalk';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { printHeader, logStep, printSuccessBox, handleScriptError } from './utils/terminal-ui.js';

async function createComponent() {
    printHeader('COMPONENT CREATION WIZARD', 'blue');

    try {
        // Get component name
        const { componentName } = await enquirer.prompt<{ componentName: string }>({
            type: 'input',
            name: 'componentName',
            message: chalk.cyan('What is the name of your component? (e.g., "UserInfo", "ProductDetails")'),
            validate: (value: string) => {
                if (!value) return chalk.red('Component name is required');
                if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
                    return chalk.red('Component name must start with uppercase letter and contain only letters and numbers');
                }
                return true;
            }
        });

        // Create components directory if it doesn't exist
        logStep('Creating components directory...');
        const componentsDir = join(process.cwd(), '..', 'cms', 'src', 'components');
        await mkdir(componentsDir, { recursive: true });
        logStep('Components directory ready', 'success');

        // Generate component content
        logStep('Generating component file...');
        const componentContent = generateComponentContent(componentName);

        const componentPath = join(componentsDir, `${componentName}.ts`);
        await writeFile(componentPath, componentContent);
        logStep('Component file created', 'success');

        printSuccessBox(
            '✅ Component created successfully!',
            `Component "${componentName}" has been created at:\n${componentPath}`
        );
    } catch (error) {
        handleScriptError(error, 'Component creation');
    }
}

function generateComponentContent(componentName: string): string {
    return `import type { Component } from '@/lib/components/form-builder/types';

export const ${componentName}Component: Component = {
    name: '${componentName}',
    schema: [
        //TODO: Add your fields here
    ]
};
`;
}

// Handle command line execution
createComponent().catch(error => handleScriptError(error, 'Component creation')); 