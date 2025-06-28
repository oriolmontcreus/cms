import SettingsIcon from '@lucide/svelte/icons/settings';
import PaletteIcon from '@lucide/svelte/icons/palette';
import TypeIcon from '@lucide/svelte/icons/type';
import WrenchIcon from '@lucide/svelte/icons/wrench';
import { TextInput, ColorPicker, Toggle, defineTab, defineTabs, TabsSelector } from '@/lib/components/form-builder/fields';
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

        // Tabs positioned here
        TabsSelector('main-tabs'),

        // Another persistent field after tabs
        TextInput('title2')
            .label('Secondary Title')
            .required()
            .min(3)
            .max(100)
            .placeholder('Enter the secondary title')
            .helperText('This field is also always visible'),

        // Fields assigned to tabs
        TextInput('subtitle')
            .label('Subtitle')
            .placeholder('Enter a subtitle')
            .helperText('Appears below the main title')
            .tab('basic'),

        TextInput('description')
            .label('Description')
            .placeholder('Enter hero description')
            .helperText('Brief description of your hero section')
            .tab('content'),

        ColorPicker('backgroundColor')
            .label('Background Color')
            .helperText('Choose the background color for the hero section')
            .tab('styling'),

        ColorPicker('textColor')
            .label('Text Color')
            .helperText('Choose the text color for the hero section')
            .tab('styling'),

        Toggle('showButton')
            .label('Show Call-to-Action Button')
            .helperText('Display a button in the hero section')
            .tab('settings'),

        Toggle('autoSave')
            .label('Auto Save')
            .helperText('Automatically save changes')
            .disabled()
            .tab('settings')
    ]
};
