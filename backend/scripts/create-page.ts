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

interface PageConfig {
    title: string;
    slug: string;
    fields: FormField[];
}

async function promptForField(): Promise<FormField | null> {
    const { shouldAdd } = await enquirer.prompt<{ shouldAdd: boolean }>({
        type: 'confirm',
        name: 'shouldAdd',
        message: 'Would you like to add a form field?',
        initial: true
    });

    if (!shouldAdd) {
        return null;
    }

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

async function createPageInDatabase(pageConfig: PageConfig) {
    try {
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
    } catch (error) {
        console.error('❌ Error creating page in database:', error);
        throw error;
    }
}

async function createPage() {
    try {
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

        // Now let's add some fields to our form
        const fields: FormField[] = [];
        
        while (true) {
            const field = await promptForField();
            if (!field) break;
            fields.push(field);
        }

        // Create the pages directory if it doesn't exist
        const pagesDir = join(process.cwd(), '..', 'src', 'lib', 'components', 'form-builder', 'pages');
        await mkdir(pagesDir, { recursive: true });

        // Create the page configuration file
        const pageConfig: PageConfig = {
            title: response.title,
            slug: response.slug,
            fields
        };

        const pageConfigPath = join(pagesDir, `${response.slug}.ts`);
        const configContent = `import type { PageConfig } from '../types';

export const config: PageConfig = ${JSON.stringify(pageConfig, null, 2)};
`;

        await writeFile(pageConfigPath, configContent);

        // Create the page in the database
        await createPageInDatabase(pageConfig);

        console.log(`✅ Page "${response.title}" created successfully!`);
        console.log(`🔗 Configuration file created at: ${pageConfigPath}`);
        console.log('Now you can access this page in the CMS and fill in the form fields.');

    } catch (error) {
        if (error instanceof Error && error.message === 'canceled') {
            console.log('❌ Page creation cancelled');
            return;
        }
        console.error('❌ Error creating page:', error);
    }
}

createPage(); 