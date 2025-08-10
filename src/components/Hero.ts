import { Repeater, TextInput } from '@/lib/components/form-builder/fields';
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

        Repeater('words')
            .label('Hero Words')
            .helperText('Words to animate in the hero section')
            .schema((index: number) => [
                TextInput('word')
                    .label('Word')
                    .required()
                    .min(2)
                    .max(100)
                    .placeholder(`Word ${index + 1}`)
                    .translatable()
            ])
    ]
};
