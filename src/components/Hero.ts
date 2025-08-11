import { TextInput, TagsInput, defineGrid, Tabs, TabField, Textarea } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';
import { IconBrandGithub, IconLink } from '@tabler/icons-svelte';

const mainTab = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
mainTab.schema = [
    TextInput('title')
        .label('Main title')
        .required()
        .min(3)
        .max(100)
        .placeholder('Enter the hero title')
        .translatable(),
    Textarea('subtitle')
        .label('Subtitle')
        .required()
        .placeholder('Enter the hero subtitle')
        .autoResize()
        .translatable(),
];

const buttonsTab = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
buttonsTab.schema = [
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
        .placeholder('https://github.com/username/repo'),];

export const HeroComponent: Component = {
    name: 'Hero',
    schema: [
        Tabs('hero')
            .tabs([
                TabField('main')
                    .label('Main')
                    .schema([mainTab]),
                TabField('buttons')
                    .label('Buttons')
                    .schema([buttonsTab]),
            ]),
        TagsInput('flip-words')
            .label('Flip words')
            .placeholder('Add word')
            .min(2)
            .max(30)
            .translatable(),
    ]
};
