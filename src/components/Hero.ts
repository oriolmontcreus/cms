import SettingsIcon from '@lucide/svelte/icons/settings';
import PaletteIcon from '@lucide/svelte/icons/palette';
import WrenchIcon from '@lucide/svelte/icons/wrench';
import LayersIcon from '@lucide/svelte/icons/layers';
import { TextInput, ColorPicker, Toggle, Tabs, TabField, GridContainer, FileInput, Repeatable } from '@/lib/components/form-builder/fields';
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
            .helperText('This field is always visible regardless of the active tab'),
        Tabs('hero-tabs')
            .tabs([
                TabField('basic')
                    .label('Basic Settings')
                    .icon(SettingsIcon)
                    .schema([
                        GridContainer(2, 4, { sm: 1, md: 2 }).add(
                            TextInput('title2')
                                .label('Secondary Title')
                                .required()
                                .min(3)
                                .max(100)
                                .placeholder('Enter the secondary title'),
                            
                            TextInput('subtitle')
                                .label('Subtitle')
                                .placeholder('Enter a subtitle')
                                .helperText('Appears below the main title'),

                            FileInput('image')
                                .label('Image')
                                .helperText('Upload an image for the hero section')
                                .allowedMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
                                .maxFileSize(1, 'mb')
                        )
                    ]),

                TabField('styling')
                    .label('Styling Options')
                    .icon(PaletteIcon)
                    .schema([
                        GridContainer(2, 4, { sm: 1, md: 2 }).add(
                            ColorPicker('backgroundColor')
                                .label('Background Color')
                                .helperText('Choose the background color for the hero section'),

                            ColorPicker('textColor')
                                .label('Text Color')
                                .helperText('Choose the text color for the hero section')
                        )
                    ]),

                TabField('settings')
                    .label('Advanced Settings')
                    .icon(WrenchIcon)
                    .schema([
                        GridContainer(2, 4, { sm: 1, md: 2 }).add(
                            Toggle('showButton')
                                .label('Show Call-to-Action Button')
                                .helperText('Display a button in the hero section'),

                            Toggle('autoSave')
                                .label('Auto Save')
                                .helperText('Automatically save changes')
                                .disabled()
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
                                TextInput('title')
                                    .label('Card Title')
                                    .required()
                                    .placeholder('Enter card title'),
                                
                                TextInput('subtitle')
                                    .label('Card Subtitle')
                                    .placeholder('Enter card subtitle'),

                                FileInput('icon')
                                    .label('Card Icon')
                                    .helperText('Upload an icon for this feature card')
                                    .allowedMimeTypes(['image/svg+xml', 'image/png'])
                                    .maxFileSize(100, 'kb'),

                                ColorPicker('accentColor')
                                    .label('Accent Color')
                                    .helperText('Choose an accent color for this card')
                            ])
                    ])
            ])
            .activeTab('basic')
            .toJSON()
    ]
};
