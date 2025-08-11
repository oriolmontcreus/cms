import { TextInput, TagsInput, defineGrid, Tabs, TabField, Textarea } from '@/lib/components/form-builder/fields';
import type { Component } from '@/lib/components/form-builder/types';

// This file demonstrates the field name validation

const testTab = defineGrid(2, 4, { sm: 1, md: 2, lg: 2 });
testTab.schema = [
    // ✅ Valid field names - these will work
    TextInput('title'),
    TextInput('firstName'),
    TextInput('user_id'),
    TextInput('userName'),
    TextInput('email123'),
    Textarea('description'),
    TagsInput('keywords'),

    // ❌ Invalid field names - these will show TypeScript errors
    // TextInput('flip-words'),        // Error: contains hyphen
    // TextInput('user name'),         // Error: contains space  
    // TextInput('123field'),          // Error: starts with number
    // TextInput('my.field'),          // Error: contains dot
    // TagsInput('some@field'),        // Error: contains @ symbol
    // Textarea('field with spaces'),  // Error: contains spaces
];

export const ValidationTestComponent: Component = {
    name: 'ValidationTest',
    schema: [
        Tabs('validationTest')
            .tabs([
                TabField('main')
                    .label('Main')
                    .schema([testTab]),
                // TabField('my-tab')          // Error: contains hyphen
                //     .label('Invalid Tab'),
                TabField('myTab')             // ✅ Valid: camelCase
                    .label('Valid Tab'),
            ]),
    ]
};
