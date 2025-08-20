import {
    FileInput,
    Repeater,
    TextInput,
    defineGrid,
    Tabs,
    TabField,
    NumberInput,
    Select,
    Toggle
} from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';

const slidesTab = defineGrid(1, 4);
slidesTab.schema = [
    Repeater('slides')
        .label('Carousel slides')
        .min(1)
        .max(10)
        .schema([
            TextInput('text')
                .label('Slide text')
                .required()
                .placeholder('Enter the slide description')
                .translatable(),
            FileInput('image')
                .label('Slide image')
                .previewWidth(200)
                .multiple()
                .required(),
            TextInput('url')
                .label('Link URL (optional)')
                .placeholder('https://example.com')
        ])
]; const settingsTab = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
settingsTab.schema = [
    NumberInput('autoplayInterval')
        .label('Autoplay Interval (ms)')
        .min(1000)
        .max(10000)
        .placeholder('4500'),

    Select('aspectRatio')
        .label('Aspect Ratio')
        .options(['video', 'square', 'wide']),

    Select('textPosition')
        .label('Text Position')
        .options(['top', 'bottom']),

    Toggle('showNavigation')
        .label('Show Navigation Arrows')
        .default(true),

    Toggle('showIndicators')
        .label('Show Indicators')
        .default(true),

    Toggle('showProgress')
        .label('Show Progress Bar')
        .default(false),

    Toggle('backgroundTips')
        .label('Background Tips Style')
        .default(false),

    Toggle('backgroundGradient')
        .label('Show Background Gradient')
        .default(true),

    Toggle('shuffleTips')
        .label('Shuffle Tips Order')
        .default(false),

    Toggle('animateText')
        .label('Animate Text')
        .default(true)
];

export const Carousel: Component = {
    name: 'Carousel',
    schema: [
        Tabs('carousel')
            .tabs([
                TabField('slides')
                    .label('Slides')
                    .schema([slidesTab]),
                TabField('settings')
                    .label('Settings')
                    .schema([settingsTab])
            ])
    ]
};