import { TextInput, ColorPicker, FileInput } from '@/lib/components/form-builder/fields';
import type { EmbeddableComponent } from '@/lib/components/form-builder/types';

export const FeatureCard: EmbeddableComponent = {
    name: 'FeatureCard',
    schema: [
        TextInput('title')
            .label('Card Title')
            .required()
            .min(3)
            .max(100)
            .placeholder('Enter the card title')
            .translatable(),

        TextInput('subtitle')
            .label('Card Subtitle')
            .placeholder('Enter the card subtitle')
            .translatable(),

        FileInput('icon')
            .label('Card Icon')
            .helperText('Upload an icon for this feature card')
            .allowedMimeTypes(['image/svg+xml', 'image/png'])
            .maxFileSize(100, 'kb'),

        ColorPicker('accentColor')
            .label('Accent Color')
            .helperText('Choose an accent color for this card')
    ]
};
