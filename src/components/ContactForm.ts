import { TextInput, Textarea, Email, Select, Toggle, defineTab, defineTabs } from '../lib/components/form-builder/fields';
import type { Component } from '../lib/components/form-builder/types';
import User from '@tabler/icons-svelte/icons/user';
import MessageCircle from '@tabler/icons-svelte/icons/message-circle';

export const ContactFormComponent: Component = {
    name: 'Contact Form',
    
    // Define tabs with name, label, and optional icon
    tabs: defineTabs(
        defineTab('personal', 'Personal Info', User),
        defineTab('message', 'Message', MessageCircle),
        defineTab('preferences', 'Preferences')
    ),
    
    activeTab: 'personal',
    
    // Fields with tab assignments
    schema: [
        // Personal Info tab
        TextInput('first_name')
            .label('First Name')
            .required()
            .placeholder('Enter your first name')
            .tab('personal'),
        
        TextInput('last_name')
            .label('Last Name')
            .required()
            .placeholder('Enter your last name')
            .tab('personal'),
        
        Email('email')
            .label('Email Address')
            .required()
            .placeholder('Enter your email address')
            .tab('personal'),
        
        TextInput('phone')
            .label('Phone Number')
            .placeholder('+1 (555) 123-4567')
            .pattern('^\\+?[1-9]\\d{1,14}$')
            .tab('personal'),
        
        // Message tab
        Select('subject')
            .label('Subject')
            .required()
            .options(['General Inquiry', 'Support', 'Sales', 'Partnership', 'Feedback'])
            .searchable()
            .tab('message'),
        
        Textarea('message')
            .label('Message')
            .required()
            .rows(4)
            .min(10)
            .max(1000)
            .placeholder('Please describe your inquiry...')
            .tab('message'),
        
        // Preferences tab
        Toggle('newsletter')
            .label('Subscribe to Newsletter')
            .helperText('Receive updates and news from us')
            .tab('preferences'),
        
        Toggle('privacy_consent')
            .label('I agree to the Privacy Policy')
            .required()
            .helperText('Required to process your request')
            .tab('preferences')
    ],
    
    validate: (data: Record<string, any>) => {
        const errors: string[] = [];
        
        if (!data.first_name) errors.push('First name is required');
        if (!data.last_name) errors.push('Last name is required');
        if (!data.email) errors.push('Email is required');
        if (!data.subject) errors.push('Subject is required');
        if (!data.message) errors.push('Message is required');
        if (!data.privacy_consent) errors.push('Privacy policy consent is required');
        
        return errors;
    }
};

export default ContactFormComponent; 