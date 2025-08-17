import { TextInput, defineGrid, Tabs, TabField } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';
import { IconWorld } from '@tabler/icons-svelte';

const siteTab = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
siteTab.schema = [
    TextInput('siteName')
        .label('Site name')
        .required()
        .placeholder('Enter your site name'),
    TextInput('contactEmail')
        .label('Contact Email')
        .type('email')
];

export const GlobalVariables: Component = {
    name: 'GlobalVariables',
    schema: [
        Tabs('globalVariables')
            .tabs([
                TabField('site')
                    .label('Site')
                    .icon(IconWorld)
                    .schema([siteTab])
            ]),
    ]
};
