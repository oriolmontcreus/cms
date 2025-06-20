import { TextInput, Textarea, Select, buildFields } from '../lib/components/form-builder/fields';

export const UserProfileFields = buildFields(
    TextInput('fullName')
        .label('Full Name')
        .required()
        .min(2)
        .max(50)
        .placeholder('Enter your full name'),
    
    Textarea('bio')
        .label('Bio')
        .max(500)
        .placeholder('Tell us about yourself')
        .helperText('Optional: Share a brief description about yourself'),
    
    Select('role')
        .label('Role')
        .required()
        .options(['Admin', 'Editor', 'Viewer'])
        .placeholder('Select your role')
);

export const UserProfileComponent = {
    name: 'UserProfile',
    fields: UserProfileFields,
    
    // Add validation rules here if needed
    validate: (data: Record<string, any>) => {
        const errors: string[] = [];
        
        if (!data.fullName) errors.push('Full Name is required');
        if (!data.role) errors.push('Role is required');
        
        return errors;
    },
    
    // Add data transformation logic here if needed
    transform: (data: Record<string, any>) => {
        return data;
    }
};

export default UserProfileComponent; 