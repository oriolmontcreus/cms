import { TextInput } from '@/lib/components/form-builder/fields';
import type { EmbeddableComponent } from '@/lib/components/form-builder/types';

export const ContactInfo: EmbeddableComponent = {
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
