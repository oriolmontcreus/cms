import { TextInput, TagsInput, defineGrid } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';

const heroGrid = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
heroGrid.schema = [
    TextInput('title')
        .label('Main title')
        .required()
        .min(3)
        .max(100)
        .placeholder('Enter the hero title')
        .translatable()
        .toJSON(),

    TextInput('docsUrl')
        .label('Docs url')
        .placeholder('https://docs.example.com')
        .toJSON(),

    TextInput('githubUrl')
        .label('GitHub repo url')
        .placeholder('https://github.com/username/repo')
        .toJSON()
];

export const HeroComponent: Component = {
    name: 'Hero',
    schema: [
        heroGrid,
        TagsInput('flip-words')
            .label('Flip words')
            .placeholder('Add word')
            .min(2)
            .max(30)
            .translatable()
            .toJSON(),
    ]
};
