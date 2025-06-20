import { TextInput, Textarea, Number, Select, Date, buildFields } from '../lib/components/form-builder/fields';

export const ContactFormFields = buildFields(
    TextInput('name')
        .label('Full Name')
        .required()
        .min(2)
        .max(50)
        .placeholder('Enter your full name')
        .helperText('Please provide your first and last name'),
    
    TextInput('email')
        .label('Email Address')
        .required()
        .pattern('^[^@]+@[^@]+\\.[^@]+$')
        .placeholder('your.email@example.com')
        .helperText('We will use this to contact you'),
    
    TextInput('phone')
        .label('Phone Number')
        .min(10)
        .max(15)
        .placeholder('+1 (555) 123-4567')
        .pattern('^[+]?[0-9\\s\\-\\(\\)]+$'),
    
    Number('age')
        .label('Age')
        .min(18)
        .max(120)
        .step(1)
        .placeholder('25')
        .helperText('Must be 18 or older'),
    
    Date('preferredDate')
        .label('Preferred Contact Date')
        .required()
        .helperText('When would you like us to contact you?'),
    
    Select('contactMethod')
        .label('Preferred Contact Method')
        .required()
        .options(['Email', 'Phone', 'SMS'])
        .placeholder('Choose your preference'),
    
    Select('interests')
        .label('Areas of Interest')
        .options(['Web Development', 'Mobile Apps', 'E-commerce', 'Consulting', 'Other'])
        .multiple()
        .helperText('Select all that apply'),
    
    Textarea('message')
        .label('Message')
        .required()
        .min(20)
        .max(1000)
        .placeholder('Tell us about your project or inquiry...')
        .helperText('Please provide as much detail as possible')
);

export const ContactFormComponent = {
    name: 'ContactForm',
    fields: ContactFormFields,
    
    validate: (data: Record<string, any>) => {
        const errors: string[] = [];
        
        if (!data.name) errors.push('Full Name is required');
        if (!data.email) errors.push('Email Address is required');
        if (!data.age) errors.push('Age is required');
        if (!data.preferredDate) errors.push('Preferred Contact Date is required');
        if (!data.contactMethod) errors.push('Preferred Contact Method is required');
        if (!data.message) errors.push('Message is required');
        
        return errors;
    },
    
    transform: (data: Record<string, any>) => {
        return {
            ...data,
            // Convert age to number if it's a string
            age: data.age ? Number(data.age) : null,
            // Ensure interests is always an array
            interests: Array.isArray(data.interests) ? data.interests : []
        };
    }
};

export default ContactFormComponent; 