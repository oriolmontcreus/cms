import Cash from '@tabler/icons-svelte/icons/cash';
import Settings from '@tabler/icons-svelte/icons/settings';
import Palette from '@tabler/icons-svelte/icons/palette';
import Calendar from '@tabler/icons-svelte/icons/calendar';
import { TextInput, Textarea, Number, DatePicker, Email, Select, Toggle, DateRangePicker, ColorPicker, RichEditor, buildFields, defineTab, defineTabs } from '../lib/components/form-builder/fields';

export const HeroComponent = {
    name: 'Hero',
    tabs: defineTabs(
        defineTab('basic', 'Basic Info', Settings),
        defineTab('content', 'Content'),
        defineTab('styling', 'Styling', Palette),
        defineTab('settings', 'Settings', Calendar)
    ),
    activeTab: 'basic',
    
    schema: buildFields(
        TextInput('title')
            .label('Title')
            .required()
            .min(3)
            .max(100)
            .columnSpan(2)
            .placeholder('Enter the hero title')
            .tab('basic'),
        
        Textarea('description')
            .label('Description')
            .min(10)
            .max(500)
            .rows(4)
            .resizable(true)
            .columnSpan(2)
            .placeholder('Enter the hero description')
            .helperText('This will be displayed as the main description on your page')
            .tab('basic'),

        TextInput('subtitle')
            .label('Subtitle')
            .placeholder('Enter a subtitle (optional)')
            .helperText('An optional subtitle that appears below the main title')
            .tab('basic'),
        
        TextInput('cta_text')
            .label('Call to Action Text')
            .placeholder('Get Started')
            .max(50)
            .suffix(Cash)
            .helperText('Text for the main action button')
            .tab('basic'),
            
        TextInput('cta_url')
            .label('Call to Action URL')
            .placeholder('https://example.com')
            .url()
            .helperText('URL where the CTA button should link to')
            .tab('basic'),
        
        Email('contact_email')
            .label('Contact Email')
            .placeholder('contact@example.com')
            .helperText('Email address for contact purposes')
            .tab('basic'),

        RichEditor('content')
            .label('Article Content')
            .placeholder('Start writing your article...')
            .required()
            .rows(10)
            .helperText('Use the toolbar to format your text.')
            .max(5000)
            .tab('content'),
        
        Textarea('notes')
            .label('Additional Notes')
            .max(200)
            .rows(3)
            .resizable(false)
            .placeholder('Add any additional notes here...')
            .helperText('Internal notes for this hero section')
            .tab('content'),

        ColorPicker('primary_color')
            .label('Primary Color')
            .placeholder('#3B82F6')
            .helperText('Main brand color for the hero section')
            .tab('styling'),
        
        ColorPicker('secondary_color')
            .label('Secondary Color')
            .placeholder('#10B981')
            .helperText('Secondary accent color (optional)')
            .tab('styling'),
        
        ColorPicker('text_color')
            .label('Text Color')
            .placeholder('#1F2937')
            .helperText('Color for the hero text content')
            .tab('styling'),
        
        ColorPicker('background_color')
            .label('Background Color')
            .placeholder('#FFFFFF')
            .readonly()
            .helperText('Background color (read-only for testing)')
            .tab('styling'),

        Select('theme')
            .label('Theme')
            .options(['light', 'dark', 'gradient', 'minimal'])
            .required()
            .searchable()
            .helperText('Visual theme for the hero section')
            .tab('styling'),
        
        Select('size')
            .label('Size')
            .options(['small', 'medium', 'large', 'full-screen'])
            .helperText('Size variant for the hero section')
            .tab('styling'),
        
        Select('alignment')
            .label('Text Alignment')
            .options(['left', 'center', 'right'])
            .helperText('How to align the hero text content')
            .tab('styling'),
        
        Select('background_type')
            .label('Background Type')
            .options(['solid', 'gradient', 'image', 'video'])
            .helperText('Type of background for the hero')
            .tab('styling'),
        
        Select('tags')
            .label('Tags')
            .options(['featured', 'promotional', 'seasonal', 'announcement', 'product-launch', 'marketing', 'campaign', 'special-offer', 'limited-time', 'new-release'])
            .multiple()
            .searchable()
            .helperText('Select multiple tags to categorize this hero')
            .tab('styling'),

        Number('display_order')
            .label('Display Order')
            .placeholder('1')
            .min(1)
            .max(100)
            .step(1)
            .prefix('#')
            .suffix(Cash)
            .helperText('Order in which this hero should appear')
            .tab('settings'),

        Number('no_decimals')
            .label('Animation Delay (seconds)')
            .placeholder('0,5')
            .min(0)
            .max(10)
            .step(0.1)
            .decimalSeparator(',')
            .allowDecimals(false)
            .helperText('Delay before animations start')
            .tab('settings'),

        DateRangePicker('eventDates')
            .label('Event Date Range')
            .required()
            .minDate('2024-01-01')
            .maxDate('2025-12-31')
            .locale('es-ES')
            .dateStyle('medium')
            .weekdayFormat('short')
            .columnSpan(2)
            .helperText('Select the start and end dates for your event')
            .tab('settings'),
        
        DatePicker('publish_date')
            .label('Publish Date')
            .weekdayFormat('long')
            .placeholder('Select a date')
            .monthFormat('short')
            .minDate(new Date())
            .maxDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))
            .yearFormat('numeric')
            .locale('es-ES')
            .dateStyle('short')
            .helperText('When this hero should go live')
            .tab('settings'),
        
        DatePicker('expiry_date')
            .label('Expiry Date')
            .helperText('Optional expiry date for time-sensitive content')
            .tab('settings'),
            
        Toggle('darkMode')
            .label('Dark Mode')
            .helperText('Switch to dark theme'),
            
        Toggle('autoSave')
            .label('Auto Save')
            .helperText('Automatically save changes')
            .disabled()
    ),
    
    validate: (data: Record<string, any>) => {
        const errors: string[] = [];
        
        if (!data.title) errors.push('Title is required');
        if (!data.description) errors.push('Description is required');
        
        return errors;
    },
    
    transform: (data: Record<string, any>) => {
        return data;
    }
};

export default HeroComponent;
