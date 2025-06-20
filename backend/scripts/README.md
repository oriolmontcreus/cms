# CMS Scripts

This directory contains scripts for generating CMS pages and components.

## Available Scripts

### Create Page
Creates a new page with basic configuration (title and slug).

```bash
npm run create-page
```

**What it does:**
- Prompts for page title and slug
- Creates a page configuration file in `cms/src/pages/`
- Creates the page entry in the database
- Initializes the page with an empty fields array

### Create Component
Creates a TypeScript component with form fields that can be used in pages.

```bash
npm run create-component
```

**What it does:**
- Prompts for component name (PascalCase)
- Allows adding multiple form fields (text, textarea, number, date, select)
- Creates a TypeScript file in `cms/src/components/`
- Includes validation and transformation logic

## Component Structure

Generated components follow this structure:

```typescript
import type { FormField } from '../lib/components/form-builder/types';

export const ComponentNameFields: FormField[] = [
    // Your fields here
];

export const ComponentNameComponent = {
    name: 'ComponentName',
    fields: ComponentNameFields,
    
    validate: (data: Record<string, any>) => {
        // Validation logic
    },
    
    transform: (data: Record<string, any>) => {
        // Data transformation logic
    }
};

export default ComponentNameComponent;
```

## Usage Workflow

1. **Create a page**: `npm run create-page`
2. **Create components**: `npm run create-component` (repeat as needed)
3. **Use components in pages**: Import and use the component fields in your page configuration

## Field Types

- **text**: Single-line text input
- **textarea**: Multi-line text input
- **number**: Numeric input
- **date**: Date picker
- **select**: Dropdown with predefined options

Each field can be marked as required and can have placeholder text. 