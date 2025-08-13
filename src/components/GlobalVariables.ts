import { TextInput, Textarea, defineGrid, Tabs, TabField, Number, Toggle } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';
import { IconCode, IconPalette, IconSettings, IconWorld } from '@tabler/icons-svelte';

const siteTab = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
siteTab.schema = [
    TextInput('siteName')
        .label('Site name')
        .required()
        .placeholder('Enter your site name')
        .translatable(),
    TextInput('siteDescription')
        .label('Site description')
        .required()
        .placeholder('Enter your site description')
        .translatable(),
    TextInput('siteUrl')
        .label('Site URL')
        .required()
        .placeholder('https://yoursite.com'),
    TextInput('contactEmail')
        .label('Contact email')
        .placeholder('contact@yoursite.com'),
];

const seoTab = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
seoTab.schema = [
    Textarea('metaDescription')
        .label('Meta description')
        .placeholder('Default meta description for your site')
        .autoResize()
        .translatable(),
    TextInput('metaKeywords')
        .label('Meta keywords')
        .placeholder('keyword1, keyword2, keyword3')
        .translatable(),
    TextInput('ogTitle')
        .label('Open Graph title')
        .placeholder('Title for social media sharing')
        .translatable(),
    Textarea('ogDescription')
        .label('Open Graph description')
        .placeholder('Description for social media sharing')
        .autoResize()
        .translatable(),
];

const themeTab = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
themeTab.schema = [
    TextInput('primaryColor')
        .label('Primary color')
        .placeholder('#000000'),
    TextInput('secondaryColor')
        .label('Secondary color')
        .placeholder('#ffffff'),
    TextInput('accentColor')
        .label('Accent color')
        .placeholder('#007bff'),
    Number('maxContentWidth')
        .label('Max content width (px)')
        .placeholder('1200')
        .min(800)
        .max(2000),
];

const analyticsTab = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
analyticsTab.schema = [
    TextInput('googleAnalyticsId')
        .label('Google Analytics ID')
        .placeholder('GA-XXXXXXXXX-X'),
    TextInput('googleTagManagerId')
        .label('Google Tag Manager ID')
        .placeholder('GTM-XXXXXXX'),
    Toggle('enableCookieConsent')
        .label('Enable cookie consent'),
    Textarea('customTrackingCode')
        .label('Custom tracking code')
        .placeholder('Additional tracking or analytics code')
        .autoResize(),
];

export const GlobalVariables: Component = {
    name: 'GlobalVariables',
    schema: [
        Tabs('globalVariables')
            .tabs([
                TabField('site')
                    .label('Site')
                    .icon(IconWorld)
                    .schema([siteTab]),
                TabField('seo')
                    .label('SEO')
                    .icon(IconCode)
                    .schema([seoTab]),
                TabField('theme')
                    .label('Theme')
                    .icon(IconPalette)
                    .schema([themeTab]),
                TabField('analytics')
                    .label('Analytics')
                    .icon(IconSettings)
                    .schema([analyticsTab]),
            ]),
    ]
};
