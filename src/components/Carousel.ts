import { FileInput, Repeater, TextInput } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';

export const CarouselComponent: Component = {
    name: 'Carousel',
    schema: [
        Repeater('slides')
            .responsiveGrid(2)
            .schema([
                FileInput('image')
                    .label('Image'),
                TextInput('caption')
                    .label('Caption'),
                TextInput('altText')
                    .label('Alternative Text')
            ])
    ]
};
