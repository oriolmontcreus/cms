# Form Builder - Refactored & Extensible

This form builder has been refactored to use a component-based approach that eliminates long if-else chains and makes it easy to add new field types. It uses a fluent interface pattern similar to Filament V3 for defining fields.

## Basic Usage

```typescript
import { TextInput, Textarea, Number, Email, Select, Date, buildFields } from './fields';

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
Number('age')
    .label('Age')
    .required()
    .min(18)                      // Minimum value
    .max(120)                     // Maximum value
    .step(1)                      // Step increment
    .placeholder('25')
```

### Date
Creates a date input field.

```typescript
Date('birthDate')
    .label('Birth Date')
    .required()
    .helperText('Select your birth date')
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

## Available Methods

All field types support these common methods:

- `.label(text)` - Set the field label (required)
- `.required(boolean)` - Make field required (default: true if called without parameter)
- `.placeholder(text)` - Set placeholder text
- `.disabled(boolean)` - Disable the field (default: true if called without parameter)
- `.readonly(boolean)` - Make field read-only (default: true if called without parameter)
- `.helperText(text)` - Add helper text below the field

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
import { TextInput, Textarea, Number, Select, Date, buildFields } from '../lib/components/form-builder/fields';

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
        .placeholder('your.email@example.com'),
    
    Number('age')
        .label('Age')
        .min(18)
        .max(120)
        .step(1),
    
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
        .placeholder('Tell us about your project...')
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