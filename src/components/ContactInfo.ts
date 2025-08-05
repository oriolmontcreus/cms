import { TextInput, registerComponentSchema } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';

export const ContactInfo: Component = {
    name: 'Contact information',
    schema: [
        TextInput('email')
            .label('Email Address')
            .required()
            .min(3)
            .max(100)
            .placeholder('Enter the email address')
    ]
};

// Register the schema for reuse
registerComponentSchema('ContactInfo', ContactInfo.schema);
