import { TextInput, Textarea, Number, DatePicker, Email, Select, buildFields, Toggle } from '../lib/components/form-builder/fields';

export const HeroFields = buildFields(
    TextInput('title')
        .label('Title')
        .required()
        .min(3)
        .max(100)
        .placeholder('Enter the hero title'),
    
    Textarea('description')
        .label('Description')
        .min(10)
        .max(500)
        .placeholder('Enter the hero description')
        .helperText('This will be displayed as the main description on your page'),
    
    TextInput('subtitle')
        .label('Subtitle')
        .placeholder('Enter a subtitle (optional)')
        .helperText('An optional subtitle that appears below the main title'),
    
    TextInput('cta_text')
        .label('Call to Action Text')
        .placeholder('Get Started')
        .max(50)
        .helperText('Text for the main action button'),
    
    TextInput('cta_url')
        .label('Call to Action URL')
        .placeholder('https://example.com')
        .url()
        .helperText('URL where the CTA button should link to'),
    
    Email('contact_email')
        .label('Contact Email')
        .placeholder('contact@example.com')
        .helperText('Email address for contact purposes'),
    
    Number('display_order')
        .label('Display Order')
        .placeholder('1')
        .min(1)
        .max(100)
        .step(1)
        .helperText('Order in which this hero should appear'),
    
    Number('no_decimals')
        .label('Animation Delay (seconds)')
        .placeholder('0,5')
        .min(0)
        .max(10)
        .step(0.1)
        .decimalSeparator(',')
        .allowDecimals(false)
        .helperText('Delay before animations start'),
    
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
        .helperText('When this hero should go live'),
    
    DatePicker('expiry_date')
        .label('Expiry Date')
        .helperText('Optional expiry date for time-sensitive content'),
    
    Select('theme')
        .label('Theme')
        .options(['light', 'dark', 'gradient', 'minimal'])
        .required()
        .searchable()
        .helperText('Visual theme for the hero section'),
    
    Select('size')
        .label('Size')
        .options(['small', 'medium', 'large', 'full-screen'])
        .helperText('Size variant for the hero section'),
    
    Select('alignment')
        .label('Text Alignment')
        .options(['left', 'center', 'right'])
        .helperText('How to align the hero text content'),
    
    Select('background_type')
        .label('Background Type')
        .options(['solid', 'gradient', 'image', 'video'])
        .helperText('Type of background for the hero'),
    
    Select('tags')
        .label('Tags')
        .options(['featured', 'promotional', 'seasonal', 'announcement', 'product-launch', 'marketing', 'campaign', 'special-offer', 'limited-time', 'new-release'])
        .multiple()
        .searchable()
        .helperText('Select multiple tags to categorize this hero'),
    
    Toggle('darkMode')
        .label('Dark Mode')
        .helperText('Switch to dark theme'),
        
    Toggle('autoSave')
        .label('Auto Save')
        .helperText('Automatically save changes')
        .disabled() // Can be disabled if needed
);

export const HeroComponent = {
    name: 'Hero',
    fields: HeroFields,
    
    // Add validation rules here if needed
    validate: (data: Record<string, any>) => {
        const errors: string[] = [];
        
        if (!data.title) errors.push('Title is required');
        if (!data.description) errors.push('Description is required');
        
        return errors;
    },
    
    // Add data transformation logic here if needed
    transform: (data: Record<string, any>) => {
        return data;
    }
};

export default HeroComponent;
