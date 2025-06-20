import enquirer from 'enquirer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

interface FormField {
    type: 'text' | 'textarea' | 'number' | 'date' | 'select';
    label: string;
    name: string;
    required?: boolean;
    placeholder?: string;
    options?: string[]; // For select fields
}

async function promptForField(): Promise<FormField | null> {
    const { shouldAdd } = await enquirer.prompt<{ shouldAdd: boolean }>({
        type: 'confirm',
        name: 'shouldAdd',
        message: 'Would you like to add a form field?',
        initial: true
    });

    if (!shouldAdd) return null;

    const fieldResponse = await enquirer.prompt<{
        type: FormField['type'];
        name: string;
        label: string;
        required: boolean;
        placeholder?: string;
    }>([
        {
            type: 'select',
            name: 'type',
            message: 'What type of field would you like to add?',
            choices: ['text', 'textarea', 'number', 'date', 'select']
        },
        {
            type: 'input',
            name: 'name',
            message: 'What is the field name? (e.g., "description", "price")',
            validate: (value: string) => {
                if (!value) return 'Field name is required';
                if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(value)) {
                    return 'Field name must start with a letter and contain only letters and numbers';
                }
                return true;
            }
        },
        {
            type: 'input',
            name: 'label',
            message: 'What is the field label? (displayed to users)',
            validate: (value: string) => {
                if (!value) return 'Field label is required';
                return true;
            }
        },
        {
            type: 'confirm',
            name: 'required',
            message: 'Is this field required?',
            initial: false
        },
        {
            type: 'input',
            name: 'placeholder',
            message: 'Enter a placeholder text (optional):'
        }
    ]);

    // If it's a select field, ask for options
    if (fieldResponse.type === 'select') {
        const { options } = await enquirer.prompt<{ options: string }>({
            type: 'input',
            name: 'options',
            message: 'Enter options separated by commas (e.g., "option1,option2,option3")',
            validate: (value: string) => {
                if (!value) return 'At least one option is required';
                return true;
            }
        });

        return {
            ...fieldResponse,
            options: options.split(',').map(opt => opt.trim())
        };
    }

    return fieldResponse;
}

async function createComponent() {
    // Get component name
    const { componentName } = await enquirer.prompt<{ componentName: string }>({
        type: 'input',
        name: 'componentName',
        message: 'What is the name of your component? (e.g., "UserInfo", "ProductDetails")',
        validate: (value: string) => {
            if (!value) return 'Component name is required';
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
                return 'Component name must start with uppercase letter and contain only letters and numbers';
            }
            return true;
        }
    });

    // Add form fields
    const fields: FormField[] = [];
    
    while (true) {
        const field = await promptForField();
        if (!field) break;
        fields.push(field);
    }

    // Create components directory if it doesn't exist
    const componentsDir = join(process.cwd(), '..', 'cms', 'src', 'components');
    await mkdir(componentsDir, { recursive: true });

    // Generate component content
    const componentContent = generateComponentContent(componentName, fields);
    
    const componentPath = join(componentsDir, `${componentName}.ts`);
    await writeFile(componentPath, componentContent);

    console.log(`✅ Component "${componentName}" created successfully!`);
    console.log(`🔗 Component file created at: ${componentPath}`);
    console.log('💡 You can now import and use this component in your pages.');
}

function generateComponentContent(componentName: string, fields: FormField[]): string {
    const fieldsString = fields.length > 0 
        ? JSON.stringify(fields, null, 4).replace(/"/g, "'")
        : '[]';

    return `import type { FormField } from '../lib/components/form-builder/types';

export const ${componentName}Fields: FormField[] = ${fieldsString};

export const ${componentName}Component = {
    name: '${componentName}',
    fields: ${componentName}Fields,
    
    // Add validation rules here if needed
    validate: (data: Record<string, any>) => {
        const errors: string[] = [];
        
        ${fields.filter(f => f.required).map(field => 
            `if (!data.${field.name}) errors.push('${field.label} is required');`
        ).join('\n        ')}
        
        return errors;
    },
    
    // Add data transformation logic here if needed
    transform: (data: Record<string, any>) => {
        return data;
    }
};

export default ${componentName}Component;
`;
}

createComponent().catch(error => {
    if (error instanceof Error && error.message === 'canceled') {
        console.log('❌ Component creation cancelled');
        return;
    }
    console.error('❌ Error creating component:', error);
}); 