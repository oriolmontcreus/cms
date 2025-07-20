import enquirer from 'enquirer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
async function createComponent() {
    // Get component name
    const { componentName } = await enquirer.prompt({
        type: 'input',
        name: 'componentName',
        message: 'What is the name of your component? (e.g., "UserInfo", "ProductDetails")',
        validate: (value) => {
            if (!value)
                return 'Component name is required';
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
                return 'Component name must start with uppercase letter and contain only letters and numbers';
            }
            return true;
        }
    });
    // Create components directory if it doesn't exist
    const componentsDir = join(process.cwd(), '..', 'cms', 'src', 'components');
    await mkdir(componentsDir, { recursive: true });
    // Generate component content
    const componentContent = generateComponentContent(componentName);
    const componentPath = join(componentsDir, `${componentName}.ts`);
    await writeFile(componentPath, componentContent);
    console.log(`✅ Component "${componentName}" created successfully!`);
    console.log(`🔗 Component file created at: ${componentPath}`);
    console.log('💡 You can now import and use this component in your pages.');
}
function generateComponentContent(componentName) {
    return `import type { Component } from '@/lib/components/form-builder/types';

export const ${componentName}Component: Component = {
    name: '${componentName}',
    schema: [
        //TODO: Add your fields here
    ]
};
`;
}
createComponent().catch(error => {
    if (error instanceof Error && error.message === 'canceled') {
        console.log('❌ Component creation cancelled');
        return;
    }
    console.error('❌ Error creating component:', error);
});
