import { Repeater, TextInput, TagsInput } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';

export const HeroComponent: Component = {
    name: 'Hero',
    schema: [
        TextInput('title')
            .label('Hero Title')
            .required()
            .min(3)
            .max(100)
            .placeholder('Enter the hero title')
            .helperText('The main title displayed in the hero section')
            .translatable(),

        TextInput('docsUrl')
            .label('Docs URL')
            .placeholder('https://docs.example.com')
            .helperText('Link to the documentation page'),

        TextInput('githubUrl')
            .label('GitHub repo URL')
            .placeholder('https://github.com/username/repo')
            .helperText('Link to the GitHub repository'),

        TagsInput('flip-words')
            .label('Flip words')
            .placeholder('Add word')
            .helperText('The flip words in color blue')
            .min(2)
            .max(30)
            .translatable(),
    ]
};
