import type { FormField } from '../lib/components/form-builder/types';

export const HeroFields: FormField[] = [
    {
        'type': 'text',
        'name': 'title',
        'label': 'Title',
        'required': true,
        'placeholder': ''
    },
    {
        'type': 'textarea',
        'name': 'description',
        'label': 'Description',
        'required': true,
        'placeholder': ''
    }
];

export const HeroComponent = {
    name: 'Hero',
    fields: HeroFields,
    
    // Add validation rules here if needed
    validate: (data: Record<string, any>) => {
        const errors: string[] = [];
        
        if (!data.title) errors.push('Title is required');
        if (!data.description) errors.push('Description is required');
        
        return errors;
    },
    
    // Add data transformation logic here if needed
    transform: (data: Record<string, any>) => {
        return data;
    }
};

export default HeroComponent;
