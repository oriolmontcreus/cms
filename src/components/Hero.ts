import SettingsIcon from '@lucide/svelte/icons/settings';
import PaletteIcon from '@lucide/svelte/icons/palette';
import WrenchIcon from '@lucide/svelte/icons/wrench';
import LayersIcon from '@lucide/svelte/icons/layers';
import { 
    TextInputOptimized as TextInput, 
    ColorPickerOptimized as ColorPicker, 
    ToggleOptimized as Toggle, 
    FileInputOptimized as FileInput, 
    RepeatableOptimized as Repeatable,
    Tabs, 
    TabField, 
    GridContainer,
    createTextField,
    createFileField
} from '@/lib/components/form-builder/optimizedFields';
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
            .helperText('This field is always visible regardless of the active tab')
            .translatable(),
        Tabs('hero-tabs')
            .tabs([
                TabField('basic')
                    .label('Basic Settings')
                    .icon(SettingsIcon)
                    .schema([
                        GridContainer(2, 4, { sm: 1, md: 2 }).add(
                            // Using optimized field creation for better performance
                            createTextField('title2', 'Secondary Title', true),

                            TextInput('subtitle')
                                .configure({
                                    label: 'Subtitle',
                                    placeholder: 'Enter a subtitle',
                                    helperText: 'Appears below the main title',
                                    translatable: true
                                }),

                            createFileField(
                                'image', 
                                'Image',
                                ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                                1
                            ).helperText('Upload an image for the hero section')
                        )
                    ]),

                TabField('styling')
                    .label('Styling Options')
                    .icon(PaletteIcon)
                    .schema([
                        GridContainer(2, 4, { sm: 1, md: 2 }).add(
                            ColorPicker('backgroundColor')
                                .configure({
                                    label: 'Background Color',
                                    helperText: 'Choose the background color for the hero section'
                                }),

                            ColorPicker('textColor')
                                .configure({
                                    label: 'Text Color',
                                    helperText: 'Choose the text color for the hero section'
                                })
                        )
                    ]),

                TabField('settings')
                    .label('Advanced Settings')
                    .icon(WrenchIcon)
                    .schema([
                        GridContainer(2, 4, { sm: 1, md: 2 }).add(
                            Toggle('showButton')
                                .configure({
                                    label: 'Show Call-to-Action Button',
                                    helperText: 'Display a button in the hero section'
                                }),

                            Toggle('autoSave')
                                .configure({
                                    label: 'Auto Save',
                                    helperText: 'Automatically save changes',
                                    disabled: true
                                })
                        )
                    ]),

                TabField('features')
                    .label('Feature Cards')
                    .icon(LayersIcon)
                    .schema([
                        Repeatable('featureCards')
                            .label('Feature Cards')
                            .helperText('Add feature cards to display in the hero section')
                            .contained()
                            .responsiveGrid(2, 4, { sm: 1, md: 2 })
                            .schema([
                                // Using batch configuration for better performance
                                createTextField('title', 'Card Title', true, true),

                                createTextField('subtitle', 'Card Subtitle', false, true)
                                    .placeholder('Enter card subtitle'),

                                createFileField(
                                    'icon',
                                    'Card Icon', 
                                    ['image/svg+xml', 'image/png'],
                                    0.1  // 100kb
                                ).helperText('Upload an icon for this feature card'),

                                ColorPicker('accentColor')
                                    .configure({
                                        label: 'Accent Color',
                                        helperText: 'Choose an accent color for this card'
                                    })
                            ])
                    ])
            ])
            .activeTab('basic')
            .toJSON()
    ]
};
