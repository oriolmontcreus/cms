import { TextInput, TagsInput, defineGrid, Tabs, TabField } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';
import { IconBrandGithub, IconLink } from '@tabler/icons-svelte';

const heroGrid = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
heroGrid.schema = [
    TextInput('title')
        .label('Main title')
        .required()
        .min(3)
        .max(100)
        .placeholder('Enter the hero title')
        .translatable(),

    TextInput('docsUrl')
        .label('Docs url')
        .suffix(IconLink)
        .placeholder('https://docs.example.com'),

    TextInput('demoUrl')
        .label('Demo url')
        .suffix(IconLink)
        .placeholder('https://demourl.example.com'),

    TextInput('githubUrl')
        .label('GitHub repo url')
        .suffix(IconBrandGithub)
        .placeholder('https://github.com/username/repo'),
];

export const HeroComponent: Component = {
    name: 'Hero',
    schema: [
        Tabs('hero')
            .tabs([
                TabField('main')
                    .label('Main')
                    .schema(heroGrid.schema),
            ]),
        TagsInput('flip-words')
            .label('Flip words')
            .placeholder('Add word')
            .min(2)
            .max(30)
            .translatable(),
    ]
};
