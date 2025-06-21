import { TextInput, Textarea, buildFields } from '../lib/components/form-builder/fields';

export const HeroFields = buildFields(
    TextInput('title')
        .label('Title')
        .required()
        .min(3)
        .max(100)
        .placeholder('Enter the hero title'),
    
    Textarea('description')
        .label('Description')
        .min(10)
        .max(500)
        .placeholder('Enter the hero description')
        .helperText('This will be displayed as the main description on your page'),
);

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
