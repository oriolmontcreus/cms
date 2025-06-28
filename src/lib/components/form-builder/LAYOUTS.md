# Form Builder Layout System

This document describes the layout system for the Form Builder component, which provides multiple approaches for organizing form fields.

## Available Approaches

### 1. Mixed Schema with TabsPlaceholder (Recommended)

The most flexible approach that allows you to position tabs anywhere in the form flow, with fields appearing before, after, or between tabs.

```typescript
import { TextInput, TabsPlaceholder, defineTab, defineTabs } from './fields';

const component = {
    name: 'MyComponent',
    tabs: defineTabs(
        defineTab('basic', 'Basic Info', SettingsIcon),
        defineTab('advanced', 'Advanced', WrenchIcon)
    ),
    schema: [
        // Persistent field at the top
        TextInput('title').label('Title').build(),
        
        // Tabs positioned here
        TabsPlaceholder('main-tabs'),
        
        // Another persistent field after tabs
        TextInput('footer').label('Footer Text').build(),
        
        // Fields assigned to tabs
        TextInput('subtitle').label('Subtitle').tab('basic').build(),
        TextInput('description').label('Description').tab('advanced').build()
    ]
};
```

**Key features:**
- **Flexible positioning**: Use `TabsPlaceholder()` to position tabs anywhere in the schema
- **Persistent fields**: Fields without `.tab()` assignment appear at their schema position
- **Tab assignment**: Use `.tab('tab-name')` to assign fields to specific tabs
- **Multiple placeholders**: You can have multiple `TabsPlaceholder()` instances (with different IDs)

### 2. Tab Utility (Legacy)

Simple approach where all persistent fields appear at the top, followed by tabs.

```typescript
const component = {
    name: 'MyComponent',
    tabs: defineTabs(
        defineTab('basic', 'Basic Info'),
        defineTab('advanced', 'Advanced')
    ),
    schema: [
        TextInput('title').label('Title').build(), // Persistent (no .tab())
        TextInput('subtitle').label('Subtitle').tab('basic').build(),
        TextInput('description').label('Description').tab('advanced').build()
    ]
};
```

### 3. Grid Layout

For responsive grid layouts with column spanning.

```typescript
import { Grid } from './fields';

const component = {
    name: 'MyComponent',
    schema: Grid()
        .columns(3)
        .gap(4)
        .responsive({ sm: 1, md: 2, lg: 3 })
        .schema([
            TextInput('title').label('Title').columnSpan(2).build(),
            TextInput('subtitle').label('Subtitle').build()
        ])
        .build()
};
```

### 4. Tabs Layout (Wrapper-based)

Traditional wrapper approach with predefined tab structure.

```typescript
import { Tabs } from './fields';

const component = {
    name: 'MyComponent',
    schema: Tabs('Configuration')
        .tabs([
            Tabs.Tab('Basic Info')
                .schema([
                    TextInput('title').label('Title').build()
                ])
                .build()
        ])
        .build()
};
```

## Helper Functions

### Tab Definitions
```typescript
// Define individual tabs
const basicTab = defineTab('basic', 'Basic Info', SettingsIcon);

// Define multiple tabs
const tabs = defineTabs(
    defineTab('basic', 'Basic Info', SettingsIcon),
    defineTab('advanced', 'Advanced', WrenchIcon)
);
```

### TabsPlaceholder
```typescript
// Default placeholder
TabsPlaceholder() // ID: 'tabs'

// Custom placeholder
TabsPlaceholder('main-tabs') // ID: 'main-tabs'
```

## Field Assignment

### Tab Assignment
```typescript
TextInput('name')
    .label('Name')
    .tab('basic') // Assigns to 'basic' tab
    .build()
```

### Column Spanning (Grid Layout)
```typescript
TextInput('title')
    .label('Title')
    .columnSpan(2) // Spans 2 columns
    .build()
```

## Best Practices

1. **Use Mixed Schema** for maximum flexibility
2. **Group related fields** in the same tab
3. **Keep persistent fields minimal** - only essential fields that need to be always visible
4. **Use meaningful tab names** that describe the content
5. **Consider responsive design** for grid layouts
6. **Test tab navigation** to ensure good UX

## Migration Guide

### From Tab Utility to Mixed Schema

**Before:**
```typescript
schema: [
    TextInput('title').label('Title').build(), // Persistent
    TextInput('subtitle').tab('basic').build()
]
```

**After:**
```typescript
schema: [
    TextInput('title').label('Title').build(), // Persistent at top
    TabsPlaceholder(), // Tabs positioned here
    TextInput('subtitle').tab('basic').build() // Assigned to tab
]
```

This allows you to control exactly where tabs appear in relation to other fields.

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
2. **Fields without `.tab()`**: Persistent fields (always visible, regardless of active tab)
3. **Invalid tab names**: Fields are assigned to the first tab with a console warning

### Persistent Fields

Fields without a `.tab()` assignment are **persistent** - they remain visible at all times, regardless of which tab is active. This is perfect for important fields that users should always see:

```typescript
schema: buildFields(
    // Persistent field - always visible
    TextInput('title')
        .label('Title')
        .required(), // No .tab() = always visible
    
    // Tab-specific fields
    TextInput('subtitle')
        .label('Subtitle')
        .tab('basic'), // Only visible in 'basic' tab
    
    ColorPicker('color')
        .label('Color')
        .tab('styling') // Only visible in 'styling' tab
)
```

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