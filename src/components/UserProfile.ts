import type { FormField } from '../lib/components/form-builder/types';

export const UserProfileFields: FormField[] = [
    {
        type: 'text',
        label: 'Full Name',
        name: 'fullName',
        required: true,
        placeholder: 'Enter your full name'
    },
    {
        type: 'textarea',
        label: 'Bio',
        name: 'bio',
        required: false,
        placeholder: 'Tell us about yourself'
    },
    {
        type: 'select',
        label: 'Role',
        name: 'role',
        required: true,
        options: ['Admin', 'Editor', 'Viewer']
    }
];

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