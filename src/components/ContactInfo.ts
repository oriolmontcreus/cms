import { TextInput } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';
import { HeroComponent } from './Hero';
import { Repeater } from '@/lib/components/form-builder/fields';

export const ContactInfo: Component = {
    name: 'Contact information',
    schema: [
        TextInput('email')
            .label('Email Address')
            .required()
            .min(3)
            .max(100)
            .placeholder('Enter the email address'),
        Repeater('heroSections')
            .schema(HeroComponent.schema) // ✅ Now possible!

    ]
};
