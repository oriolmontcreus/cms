# Layout System - Ultimate Simplicity

The Form Builder now supports the most intuitive layout system possible! Instead of complex wrappers, you can simply assign any field to a tab using the `.tab('tab-name')` utility method. This approach is inspired by Filament V3 but made even simpler.

## Tab Utility Approach (Recommended)

### The Simplest Way to Create Tabs

Just define your tabs once, then assign fields to them using `.tab()`:

```typescript
import { TextInput, Email, buildFields, defineTab, defineTabs } from './fields';
import Settings from '@tabler/icons-svelte/icons/settings';
import User from '@tabler/icons-svelte/icons/user';

const MyComponent = {
    name: 'My Component',
    
    // Define tabs with name, label, and optional icon
    tabs: defineTabs(
        defineTab('personal', 'Personal Info', User),
        defineTab('settings', 'Settings', Settings)
    ),
    
    activeTab: 'personal', // Optional: set initially active tab
    
    // Just assign fields to tabs using .tab()
    schema: buildFields(
        TextInput('name')
            .label('Name')
            .tab('personal'), // ← This field goes to 'personal' tab
            
        Email('email')
            .label('Email')
            .tab('personal'), // ← This field also goes to 'personal' tab
            
        TextInput('api_key')
            .label('API Key')
            .tab('settings') // ← This field goes to 'settings' tab
    )
};
```

### Key Benefits

✅ **Ultra Simple**: Just add `.tab()` to any field  
✅ **No Nesting**: Fields stay at the same level  
✅ **Easy to Move**: Change a field's tab by changing one method call  
✅ **Clear Organization**: Tab definitions are separate from field definitions  
✅ **Optional Icons**: Add icons to tabs for better UX  

## Grid Layout

Grid layouts work exactly as before:

```typescript
import { Grid, TextInput, Email } from './fields';

const MyComponent = {
    name: 'My Component',
    schema: Grid('Contact Form')
        .columns(2)
        .gap(6)
        .responsive({ sm: 1, md: 2, lg: 2 })
        .schema([
            TextInput('first_name').label('First Name').build(),
            Email('email').columnSpan(2).build()
        ])
        .build()
};
```

## Complete Examples

### Hero Component with Tab Utility

```typescript
import { TextInput, Textarea, ColorPicker, buildFields, defineTab, defineTabs } from './fields';
import Settings from '@tabler/icons-svelte/icons/settings';
import Palette from '@tabler/icons-svelte/icons/palette';

export const HeroComponent = {
    name: 'Hero',
    
    tabs: defineTabs(
        defineTab('basic', 'Basic Info', Settings),
        defineTab('styling', 'Styling', Palette)
    ),
    
    activeTab: 'basic',
    
    schema: buildFields(
        TextInput('title')
            .label('Title')
            .required()
            .tab('basic'),
        
        Textarea('description')
            .label('Description')
            .tab('basic'),
        
        ColorPicker('primary_color')
            .label('Primary Color')
            .tab('styling'),
        
        ColorPicker('secondary_color')
            .label('Secondary Color')
            .tab('styling')
    )
};
```

### Contact Form with Tab Utility

```typescript
import { TextInput, Email, Textarea, Toggle, buildFields, defineTab, defineTabs } from './fields';
import User from '@tabler/icons-svelte/icons/user';
import MessageCircle from '@tabler/icons-svelte/icons/message-circle';

export const ContactFormComponent = {
    name: 'Contact Form',
    
    tabs: defineTabs(
        defineTab('personal', 'Personal Info', User),
        defineTab('message', 'Message', MessageCircle),
        defineTab('preferences', 'Preferences')
    ),
    
    activeTab: 'personal',
    
    schema: buildFields(
        TextInput('first_name')
            .label('First Name')
            .required()
            .tab('personal'),
        
        Email('email')
            .label('Email')
            .required()
            .tab('personal'),
        
        Textarea('message')
            .label('Message')
            .required()
            .tab('message'),
        
        Toggle('newsletter')
            .label('Subscribe to Newsletter')
            .tab('preferences')
    )
};
```

## Tab Definitions

### defineTab(name, label, icon?)

Creates a tab definition:
- **name**: Unique identifier used in `.tab('name')`
- **label**: Display name shown in the UI
- **icon**: Optional icon component

### defineTabs(...tabs)

Helper to create an array of tab definitions. Just a convenience function.

## Component Properties

### tabs
Array of tab definitions created with `defineTab()` and `defineTabs()`.

### activeTab (optional)
Name of the initially active tab. If not specified, the first tab will be active.

### schema
Array of fields, some of which can have `.tab('tab-name')` assignments.

## Field Assignment Rules

1. **Fields with `.tab()`**: Assigned to the specified tab
2. **Fields without `.tab()`**: Assigned to the first tab
3. **Invalid tab names**: Fields are assigned to the first tab with a console warning

## Migration Examples

### From Wrapper Approach
```typescript
// ❌ Old wrapper approach
schema: Tabs('My Form')
    .tabs([
        Tabs.Tab('Basic Info')
            .schema([
                TextInput('title').label('Title').build()
            ])
            .build()
    ])
    .build()
```

### To Tab Utility Approach
```typescript
// ✅ New tab utility approach
tabs: defineTabs(
    defineTab('basic', 'Basic Info', Settings)
),

schema: buildFields(
    TextInput('title')
        .label('Title')
        .tab('basic')
)
```

## Why This Approach is Better

1. **🎯 Intuitive**: Just add `.tab()` to any field
2. **🔧 Flexible**: Easy to move fields between tabs
3. **📖 Readable**: Clear separation of tab definitions and field definitions
4. **⚡ Simple**: No complex nesting or wrapper syntax
5. **🚀 Fast**: Quick to write and modify
6. **🎨 Clean**: Less boilerplate code

## Default Layout (No Tabs)

If you don't define tabs, fields render in a simple vertical layout:

```typescript
const SimpleComponent = {
    name: 'Simple Component',
    schema: buildFields(
        TextInput('name').label('Name'),
        Email('email').label('Email')
    )
};
```

## Advanced: Combining with Grid

You can even combine tabs with grid layouts by using the wrapper approach inside tabs, but the tab utility approach is recommended for most use cases.

The tab utility approach makes creating organized, tabbed forms incredibly simple and intuitive! 