import SettingsIcon from '@lucide/svelte/icons/settings';
import PaletteIcon from '@lucide/svelte/icons/palette';
import TypeIcon from '@lucide/svelte/icons/type';
import WrenchIcon from '@lucide/svelte/icons/wrench';
import { TextInput, ColorPicker, Toggle, Tabs, TabField, GridContainer, FileUpload } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';

export const HeroComponent: Component = {
    name: 'Hero',
    schema: [
        // Persistent field at the top
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

                            FileUpload('image')
                                .label('Image')
                                .helperText('Upload an image for the hero section')
                                .allowedMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
                                .maxFileSize(1 * 1024 * 1024)
                        )
                    ]),

                TabField('content')
                    .label('Content')
                    .icon(TypeIcon)
                    .schema([
                        GridContainer(1, 6).add(
                            TextInput('description')
                                .label('Description')
                                .placeholder('Enter hero description')
                                .helperText('Brief description of your hero section')
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
                    ])
            ])
            .activeTab('basic')
            .toJSON()
    ]
};
