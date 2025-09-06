# Form Builder

A flexible and scalable form builder component for dynamic form generation.

## Quick Start

```svelte
<script>
    import FormBuilder from './FormBuilder.svelte';
    
    export let config;
    export let slug; 
    export let components;
</script>

<FormBuilder {config} {slug} {components} />
```

## Supported Schema Types

1. **Filament Tabs** - Modern `tabs-container` schema
2. **Mixed Schema** - Complex `tabs-selector` schema  
3. **Grid Layout** - `grid` type schema
4. **Tab Layout** - `tabs` type schema
5. **Default** - Simple field array

## Architecture

```
form-builder/
├── FormBuilder.svelte          ← Main component (44 lines)
├── components/                 ← Specialized renderers
│   ├── ComponentRenderer.svelte
│   ├── FilamentTabsRenderer.svelte
│   ├── MixedSchemaRenderer.svelte
│   ├── DefaultRenderer.svelte
│   └── ResponsiveTabTrigger.svelte
├── utils/formHelpers.ts        ← Utility functions
├── constants.ts                ← Centralized constants
└── layouts/                    ← Layout components
    ├── GridLayout.svelte
```

## Key Features

✅ **Zero Breaking Changes** - Same API as before  
✅ **90% Code Reduction** - Main file went from 439 to 44 lines  
✅ **Modular Architecture** - Each schema type has its own renderer  
✅ **No Magic Strings** - All constants centralized  
✅ **Fully Typed** - Complete TypeScript support  
✅ **Easy Testing** - Small, focused components  

## Documentation

- **[REFACTOR_GUIDE.md](./REFACTOR_GUIDE.md)** - Detailed explanation of the refactor
- **[types.ts](./types.ts)** - TypeScript type definitions
- **[constants.ts](./constants.ts)** - All constants and magic strings

# Form Builder - Refactored & Extensible

This form builder has been refactored to use a component-based approach that eliminates long if-else chains and makes it easy to add new field types. It uses a fluent interface pattern similar to Filament V3 for defining fields.

## Basic Usage

```typescript
import { TextInput, Textarea, Number, Email, Select, Date, FileUpload, buildFields } from './fields';

export const MyFormFields = buildFields(
    TextInput('username')
        .label('Username')
        .required()
        .min(3)
        .max(20)
        .placeholder('Enter your username'),
    
    Email('email')
        .label('Email Address')
        .required()
        .placeholder('Enter your email'),
    
    Textarea('bio')
        .label('Biography')
        .max(500)
        .placeholder('Tell us about yourself')
        .helperText('Optional: Share a brief description')
);
```

## Field Types

### TextInput
Creates a text input field with validation options.

```typescript
import AtSign from '@lucide/svelte/icons/at-sign';
import Search from '@lucide/svelte/icons/search';

TextInput('fieldName')
    .label('Field Label')
    .required()                    // Makes field required
    .min(3)                       // Minimum length
    .max(50)                      // Maximum length
    .pattern('^[a-zA-Z]+$')       // Regex pattern validation
    .placeholder('Enter text...')  // Placeholder text
    .disabled()                   // Disable the field
    .readonly()                   // Make field read-only
    .helperText('Help text')      // Additional help text
    .prefix(AtSign)               // Add prefix icon
    .suffix(Search)               // Add suffix icon
    .prefix('$')                  // Add prefix text
    .suffix('.com')               // Add suffix text
```

#### Prefix and Suffix Options

You can add icons or text before (prefix) and after (suffix) your input fields. Simply pass either a string or an icon component:

**With Icons:**
```typescript
import AtSign from '@lucide/svelte/icons/at-sign';
import Search from '@lucide/svelte/icons/search';

TextInput('email')
    .label('Email')
    .prefix(AtSign)               // Icon prefix
    .suffix(Search)               // Icon suffix
```

**With Text:**
```typescript
TextInput('price')
    .label('Price')
    .prefix('$')                  // Text prefix
    .suffix('USD')                // Text suffix
```

**Mixed (Icon + Text):**
```typescript
import DollarSign from '@lucide/svelte/icons/dollar-sign';

TextInput('amount')
    .label('Amount')
    .prefix(DollarSign)           // Icon prefix
    .suffix('per month')          // Text suffix
```

### Textarea
Creates a textarea field for longer text input.

```typescript
Textarea('description')
    .label('Description')
    .required()
    .min(10)                      // Minimum length
    .max(1000)                    // Maximum length
    .placeholder('Enter description...')
    .helperText('Provide detailed information')
```

### Number
Creates a number input field with numeric validation.

```typescript
import DollarSign from '@lucide/svelte/icons/dollar-sign';

Number('age')
    .label('Age')
    .required()
    .min(18)                      // Minimum value
    .max(120)                     // Maximum value
    .step(1)                      // Step increment
    .placeholder('25')
    .prefix(DollarSign)           // Add prefix icon
    .suffix('USD')                // Add suffix text
```

### DatePicker
Creates a date input field.

```typescript
DatePicker('birthDate')
    .label('Birth Date')
    .required()
    .minDate('2000-01-01')        // Minimum selectable date
    .maxDate('2030-12-31')        // Maximum selectable date
    .locale('en-US')              // Date locale
    .dateStyle('medium')          // Date display style
    .helperText('Select your birth date')
```

### DateRangePicker
Creates a date range picker field that allows selecting start and end dates.

```typescript
DateRangePicker('eventDates')
    .label('Event Date Range')
    .required()
    .minDate('2024-01-01')        // Minimum selectable date
    .maxDate('2025-12-31')        // Maximum selectable date
    .locale('en-US')              // Date locale
    .dateStyle('medium')          // Date display style
    .weekdayFormat('short')       // Weekday format (short, long, narrow)
    .helperText('Select the start and end dates for your event')
```

### Select
Creates a select dropdown field.

```typescript
Select('category')
    .label('Category')
    .required()
    .options(['Option 1', 'Option 2', 'Option 3'])
    .placeholder('Choose an option')
    .multiple()                   // Allow multiple selections
```

### FileUpload
Creates a file upload field with drag-and-drop support, MIME type validation, and file size limits.

```typescript
FileUpload('documents')
    .label('Upload Documents')
    .required()
    .multiple()                   // Allow multiple file uploads
    .allowedMimeTypes([           // Restrict file types
        'image/jpeg',
        'image/png',
        'application/pdf',
        'text/plain'
    ])
    .maxFileSize(5 * 1024 * 1024) // 5MB max file size
    .helperText('Upload PDF, images, or text files (max 5MB each)')
```

**Common MIME Types:**
- Images: `'image/jpeg'`, `'image/png'`, `'image/gif'`, `'image/webp'`
- Documents: `'application/pdf'`, `'text/plain'`, `'application/msword'`
- Archives: `'application/zip'`, `'application/x-rar-compressed'`
- Audio: `'audio/mpeg'`, `'audio/wav'`, `'audio/ogg'`
- Video: `'video/mp4'`, `'video/avi'`, `'video/quicktime'`

**File Size Examples:**
- 1MB: `1 * 1024 * 1024`
- 5MB: `5 * 1024 * 1024`
- 10MB: `10 * 1024 * 1024`

## Available Methods

All field types support these common methods:

- `.label(text)` - Set the field label (required)
- `.required(boolean)` - Make field required (default: true if called without parameter)
- `.placeholder(text)` - Set placeholder text
- `.disabled(boolean)` - Disable the field (default: true if called without parameter)
- `.readonly(boolean)` - Make field read-only (default: true if called without parameter)
- `.helperText(text)` - Add helper text below the field
- `.prefix(value)` - Add prefix text or icon before the input (string or icon component)
- `.suffix(value)` - Add suffix text or icon after the input (string or icon component)

### Type-specific Methods

**TextInput & Textarea:**
- `.min(length)` - Minimum character length
- `.max(length)` - Maximum character length
- `.pattern(regex)` - Regex validation pattern (TextInput only)

**Number:**
- `.min(value)` - Minimum numeric value
- `.max(value)` - Maximum numeric value
- `.step(value)` - Step increment for the number input

**Select:**
- `.options(array)` - Array of options for the select field
- `.multiple(boolean)` - Allow multiple selections (default: true if called without parameter)

**DatePicker & DateRangePicker:**
- `.minDate(date)` - Minimum selectable date (ISO string format)
- `.maxDate(date)` - Maximum selectable date (ISO string format)
- `.locale(string)` - Date locale (e.g., 'en-US', 'es-ES')
- `.dateStyle(style)` - Date display style ('full', 'long', 'medium', 'short')
- `.weekdayFormat(format)` - Weekday format ('short', 'long', 'narrow')
- `.yearFormat(format)` - Year format ('numeric', '2-digit')
- `.monthFormat(format)` - Month format ('numeric', '2-digit', 'short', 'long', 'narrow')

**FileUpload:**
- `.allowedMimeTypes(array)` - Array of allowed MIME types (e.g., ['image/jpeg', 'application/pdf'])
- `.maxFileSize(bytes)` - Maximum file size in bytes (e.g., 5 * 1024 * 1024 for 5MB)
- `.multiple(boolean)` - Allow multiple file uploads (default: true if called without parameter)

## Building Fields

Use the `buildFields()` function to convert your fluent field definitions into the FormField array:

```typescript
import { buildFields } from './fields';

export const MyFields = buildFields(
    TextInput('name').label('Name').required(),
    Textarea('bio').label('Bio').max(500)
);
```

## Complete Example

```typescript
import { TextInput, Textarea, Number, Select, DatePicker, DateRangePicker, FileUpload, buildFields } from '../lib/components/form-builder/fields';
import AtSign from '@lucide/svelte/icons/at-sign';
import DollarSign from '@lucide/svelte/icons/dollar-sign';
import Search from '@lucide/svelte/icons/search';

export const ContactFormFields = buildFields(
    TextInput('name')
        .label('Full Name')
        .required()
        .min(2)
        .max(50)
        .placeholder('Enter your full name'),
    
    TextInput('email')
        .label('Email Address')
        .required()
        .pattern('^[^@]+@[^@]+\\.[^@]+$')
        .placeholder('your.email@example.com')
        .prefix('@', AtSign),
    
    TextInput('website')
        .label('Website')
        .placeholder('your-site')
        .prefix('https://')
        .suffix('.com'),
    
    Number('budget')
        .label('Project Budget')
        .min(100)
        .max(100000)
        .step(100)
        .prefix(DollarSign)
        .suffix('USD'),
    
    TextInput('search')
        .label('Search Keywords')
        .placeholder('Enter keywords...')
        .suffix('search', Search),
    
    Select('interests')
        .label('Areas of Interest')
        .options(['Web Development', 'Mobile Apps', 'E-commerce'])
        .multiple()
        .helperText('Select all that apply'),
    
    Textarea('message')
        .label('Message')
        .required()
        .min(20)
        .max(1000)
        .placeholder('Tell us about your project...'),
    
    FileUpload('attachments')
        .label('Project Files')
        .multiple()
        .allowedMimeTypes([
            'image/jpeg',
            'image/png',
            'application/pdf',
            'text/plain'
        ])
        .maxFileSize(10 * 1024 * 1024)
        .helperText('Upload images, PDFs, or text files (max 10MB each)')
);
```

This fluent interface makes form field definitions more readable and provides better IDE support with autocomplete and type checking.

## Refactoring Benefits

The FormBuilder has been refactored from a monolithic component with long if-else chains to a modular, component-based architecture:

### Before (Monolithic):
- One large component with 100+ lines of if-else statements
- Hard to maintain and extend
- Adding new field types required modifying the main component

### After (Component-based):
- Each field type is its own component
- Main FormBuilder is now ~50 lines
- Builder file reduced from 160+ lines to ~70 lines
- Adding new field types is as simple as:
  1. Create a new field component in `fields/` directory
  2. Add it to the `fieldComponents` mapping
  3. Add one line to `fields.ts`: `export const NewField = (name: string) => new FieldBuilder('newtype', name);`

### Architecture:
- `FormBuilder.svelte` - Main form container (handles submission logic)
- `FormField.svelte` - Field wrapper (handles labels, help text)
- `fields/` - Individual field components (TextInput, SelectInput, etc.)
- `types.ts` - Type definitions
- `fields.ts` - Simple, unified field builder (now ~70 lines vs 160+ lines)

### Key Improvements:
- **Simplified Builder**: One flexible `FieldBuilder` class instead of 6+ separate classes
- **Consistent API**: All field types use the same methods (only relevant ones apply)
- **Easy to Extend**: Adding new field types requires just one line: `export const NewField = (name: string) => new FieldBuilder('newtype', name);`
- **Reduced Code**: Cut the builder file size by more than half

This makes the codebase more maintainable, testable, and easier to extend with new field types. 