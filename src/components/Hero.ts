import SettingsIcon from '@lucide/svelte/icons/settings';
import PaletteIcon from '@lucide/svelte/icons/palette';
import TypeIcon from '@lucide/svelte/icons/type';
import WrenchIcon from '@lucide/svelte/icons/wrench';
import { TextInput, ColorPicker, Toggle, defineTab, defineTabs, TabsSelector, GridContainer } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';

export const HeroComponent: Component = {
    name: 'Hero',
    tabs: defineTabs(
        defineTab('basic', 'Basic Info', SettingsIcon),
        defineTab('content', 'Content', TypeIcon),
        defineTab('styling', 'Styling', PaletteIcon),
        defineTab('settings', 'Settings', WrenchIcon)
    ),
    activeTab: 'basic',
    schema: [
        // Persistent field at the top
        TextInput('title')
            .label('Hero Title')
            .required()
            .min(3)
            .max(100)
            .placeholder('Enter the hero title')
            .helperText('This field is always visible regardless of the active tab'),

        // Grid for title fields - responsive 2 columns on md+, 1 on mobile
        GridContainer(2, 4, { sm: 1, md: 2 }).add(
            TextInput('title2')
                .label('Secondary Title')
                .required()
                .min(3)
                .max(100)
                .placeholder('Enter the secondary title')
                .tab('basic'),
            
            TextInput('subtitle')
                .label('Subtitle')
                .placeholder('Enter a subtitle')
                .helperText('Appears below the main title')
                .tab('basic')
        ),

        // Tabs positioned here
        TabsSelector('main-tabs'),

        // Grid for content fields
        GridContainer(1, 6).add(
            TextInput('description')
                .label('Description')
                .placeholder('Enter hero description')
                .helperText('Brief description of your hero section')
                .tab('content')
        ),

        // Grid for styling - 2 columns for colors
        GridContainer(2, 4, { sm: 1, md: 2 }).add(
            ColorPicker('backgroundColor')
                .label('Background Color')
                .helperText('Choose the background color for the hero section')
                .tab('styling'),

            ColorPicker('textColor')
                .label('Text Color')
                .helperText('Choose the text color for the hero section')
                .tab('styling')
        ),

        // Grid for settings - responsive layout
        GridContainer(2, 4, { sm: 1, md: 2 }).add(
            Toggle('showButton')
                .label('Show Call-to-Action Button')
                .helperText('Display a button in the hero section')
                .tab('settings'),

            Toggle('autoSave')
                .label('Auto Save')
                .helperText('Automatically save changes')
                .disabled()
                .tab('settings')
        )
    ]
};
