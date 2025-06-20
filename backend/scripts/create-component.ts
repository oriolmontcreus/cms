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
    min?: number;
    max?: number;
    step?: number;
    helperText?: string;
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
        helperText?: string;
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
        },
        {
            type: 'input',
            name: 'helperText',
            message: 'Enter helper text (optional):'
        }
    ]);

    let field: FormField = fieldResponse;

    // Add constraints based on field type
    if (fieldResponse.type === 'text' || fieldResponse.type === 'textarea') {
        const { min, max } = await enquirer.prompt<{ min?: number; max?: number }>([
            {
                type: 'numeral',
                name: 'min',
                message: 'Minimum length (optional):'
            },
            {
                type: 'numeral',
                name: 'max',
                message: 'Maximum length (optional):'
            }
        ]);
        if (min) field.min = min;
        if (max) field.max = max;
    } else if (fieldResponse.type === 'number') {
        const { min, max, step } = await enquirer.prompt<{ min?: number; max?: number; step?: number }>([
            {
                type: 'numeral',
                name: 'min',
                message: 'Minimum value (optional):'
            },
            {
                type: 'numeral',
                name: 'max',
                message: 'Maximum value (optional):'
            },
            {
                type: 'numeral',
                name: 'step',
                message: 'Step value (optional):'
            }
        ]);
        if (min !== undefined) field.min = min;
        if (max !== undefined) field.max = max;
        if (step !== undefined) field.step = step;
    } else if (fieldResponse.type === 'select') {
        const { options } = await enquirer.prompt<{ options: string }>({
            type: 'input',
            name: 'options',
            message: 'Enter options separated by commas (e.g., "option1,option2,option3")',
            validate: (value: string) => {
                if (!value) return 'At least one option is required';
                return true;
            }
        });
        field.options = options.split(',').map(opt => opt.trim());
    }

    return field;
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
    // Generate imports based on field types
    const fieldTypes = [...new Set(fields.map(f => f.type))];
    const imports = fieldTypes.map(type => {
        switch (type) {
            case 'text': return 'TextInput';
            case 'textarea': return 'Textarea';
            case 'number': return 'Number';
            case 'date': return 'Date';
            case 'select': return 'Select';
            default: return '';
        }
    }).filter(Boolean);

    const importStatement = `import { ${imports.join(', ')}, buildFields } from '../lib/components/form-builder/fields';`;

    // Generate field definitions using fluent interface
    const fieldDefinitions = fields.map(field => {
        const fieldType = field.type === 'text' ? 'TextInput' : 
                         field.type === 'textarea' ? 'Textarea' :
                         field.type === 'number' ? 'Number' :
                         field.type === 'date' ? 'Date' :
                         field.type === 'select' ? 'Select' : 'TextInput';

        let fieldDef = `    ${fieldType}('${field.name}')`;
        fieldDef += `\n        .label('${field.label}')`;
        
        if (field.required) fieldDef += `\n        .required()`;
        if (field.placeholder) fieldDef += `\n        .placeholder('${field.placeholder}')`;
        if (field.min !== undefined) fieldDef += `\n        .min(${field.min})`;
        if (field.max !== undefined) fieldDef += `\n        .max(${field.max})`;
        if (field.step !== undefined) fieldDef += `\n        .step(${field.step})`;
        if (field.helperText) fieldDef += `\n        .helperText('${field.helperText}')`;
        if (field.options) fieldDef += `\n        .options([${field.options.map(opt => `'${opt}'`).join(', ')}])`;

        return fieldDef;
    }).join(',\n\n');

    return `${importStatement}

export const ${componentName}Fields = buildFields(
${fieldDefinitions}
);

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