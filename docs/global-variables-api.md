# Global Variables API Documentation

This system provides a comprehensive solution for managing and accessing global variables in your Astro/CMS project, with support for translations, validation, and both template-based and programmatic access.

## Features

- ✅ **Template Integration**: `{{variableName}}` syntax in JSON data
- ✅ **Programmatic API**: Direct access to variables in Astro components  
- ✅ **Translation Support**: Locale-specific variable values
- ✅ **Conflict Resolution**: Clear precedence rules for duplicate keys
- ✅ **Type Safety**: TypeScript support with proper typing
- ✅ **Validation**: Prevents conflicts and ensures data integrity
- ✅ **Development Tools**: Debugging and validation helpers

## Quick Start

### 1. Using Variables in Templates (Existing Feature)

In your JSON data files, use `{{variableName}}` syntax:

```json
{
  "title": "{{siteName}}",
  "description": "Welcome to {{siteName}} - the best CMS!"
}
```

### 2. Using Variables in Code (New Feature)

In your Astro components:

```astro
---
import { 
  getGlobalVariable, 
  getGlobalVariables, 
  getAllGlobalVariables 
} from '../utils/global-variables-api';

// Get a single variable
const siteName = await getGlobalVariable('siteName');

// Get multiple variables efficiently
const { siteName, contactEmail } = await getGlobalVariables(['siteName', 'contactEmail']);

// Get with locale support
const siteNameInSpanish = await getGlobalVariable('siteName', { locale: 'es-ES' });

// Get with fallback value
const theme = await getGlobalVariable('theme', { fallback: 'dark' });
---

<h1>{siteName}</h1>
<p>Contact us: {contactEmail}</p>
```

## API Reference

### Async API (Recommended for Astro frontmatter)

#### `getGlobalVariable(key, options?)`
Get a single global variable value.

```typescript
const value = await getGlobalVariable('siteName');
const valueWithFallback = await getGlobalVariable('siteName', { fallback: 'Default' });
const localizedValue = await getGlobalVariable('siteName', { locale: 'es-ES' });
```

**Parameters:**
- `key` (string): Variable name
- `options` (optional):
  - `locale` (string): Specific locale to use
  - `fallback` (any): Value to return if variable not found

#### `getGlobalVariables(keys, options?)`
Get multiple variables efficiently.

```typescript
const vars = await getGlobalVariables(['siteName', 'contactEmail', 'theme']);
// Returns: { siteName: '...', contactEmail: '...', theme: '...' }
```

#### `getAllGlobalVariables(options?)`
Get all user-defined variables (excludes system keys).

```typescript
const allVars = await getAllGlobalVariables();
const allVarsInFrench = await getAllGlobalVariables({ locale: 'fr-FR' });
```

### Sync API (For reactive contexts)

```typescript
import { 
  getGlobalVariableSync, 
  getGlobalVariablesSync, 
  refreshGlobalVariablesCache 
} from '../utils/global-variables-api';

// Initialize cache first (in component script or onMount)
await refreshGlobalVariablesCache();

// Then use sync methods
const siteName = getGlobalVariableSync('siteName');
const vars = getGlobalVariablesSync(['siteName', 'theme']);
```

### Development & Debugging

#### `validateGlobalVariables()`
Check for conflicts and validation issues.

```typescript
const validation = await validateGlobalVariables();
if (!validation.isValid) {
  console.log('Conflicts:', validation.conflicts);
}
console.log('Warnings:', validation.warnings);
```

#### `listGlobalVariables()`
List all available variables and locales.

```typescript
const { userVariables, systemKeys, locales } = await listGlobalVariables();
console.log('Available variables:', userVariables);
console.log('Available locales:', locales);
```

## Variable Resolution Priority

When a variable exists in multiple places, the system uses this priority order:

1. **Translation for specified locale** (if locale provided)
2. **Root level variable**
3. **Fallback value** (if provided)
4. **undefined**

Example data structure:
```json
{
  "siteName": "EXCALIBUR",
  "translations": {
    "es-ES": {
      "siteName": "EXCALIBUR ES"
    },
    "fr-FR": {
      "siteName": "EXCALIBUR FR"
    }
  }
}
```

Results:
- `getGlobalVariable('siteName')` → `"EXCALIBUR"`
- `getGlobalVariable('siteName', { locale: 'es-ES' })` → `"EXCALIBUR ES"`
- `getGlobalVariable('siteName', { locale: 'de-DE' })` → `"EXCALIBUR"` (falls back to root)

## Data Structure

Global variables are stored in `site/src/data/globalVariables.json`:

```json
{
  "siteName": "EXCALIBUR",
  "contactEmail": "hello@example.com",
  "theme": "dark",
  "translations": {
    "es-ES": {
      "siteName": "EXCALIBUR ES",
      "contactEmail": "hola@example.com"
    },
    "fr-FR": {
      "siteName": "EXCALIBUR FR",
      "contactEmail": "bonjour@example.com"
    }
  },
  "updatedAt": "2025-09-06T15:30:00.000Z"
}
```

### System Keys (Reserved)

- `translations`: Contains locale-specific translations
- `updatedAt`: Timestamp of last update

## Validation Rules

The system validates global variables to prevent issues:

### Errors (Prevent saving)
- Reserved key conflicts (`translations`, `updatedAt` cannot be user variables)
- Invalid variable names (must start with letter/underscore, contain only alphanumeric and underscores)
- Empty variable names

### Warnings (Allow saving but show notifications)
- Translation keys without corresponding root variables
- Root variables without translations for available locales  
- Variables with null values
- Variables with object values (may not work in templates)

## Best Practices

### 1. Variable Naming
```typescript
// ✅ Good
const siteName = await getGlobalVariable('siteName');
const apiUrl = await getGlobalVariable('api_url');

// ❌ Bad
const site-name = await getGlobalVariable('site-name'); // Invalid characters
const 2siteName = await getGlobalVariable('2siteName'); // Starts with number
```

### 2. Use Fallbacks
```typescript
// ✅ Good - Always provide fallbacks for optional variables
const theme = await getGlobalVariable('theme', { fallback: 'light' });
const maxItems = await getGlobalVariable('max_items', { fallback: 10 });

// ❌ Risky - Could return undefined
const theme = await getGlobalVariable('theme');
```

### 3. Batch Operations
```typescript
// ✅ Efficient - One operation
const { siteName, theme, contactEmail } = await getGlobalVariables([
  'siteName', 'theme', 'contactEmail'
]);

// ❌ Inefficient - Multiple operations  
const siteName = await getGlobalVariable('siteName');
const theme = await getGlobalVariable('theme');
const contactEmail = await getGlobalVariable('contactEmail');
```

### 4. Development Validation
```astro
---
// Add validation in development
if (import.meta.env.DEV) {
  const validation = await validateGlobalVariables();
  if (!validation.isValid) {
    console.error('Global variables validation failed:', validation.conflicts);
  }
}
---
```

## Migration from Template-Only Usage

If you're currently only using `{{variableName}}` in templates, you can gradually migrate:

### Before (Template only)
```json
{
  "hero": {
    "title": "Welcome to {{siteName}}",
    "subtitle": "{{siteName}} is the best CMS"
  }
}
```

### After (Mixed approach)
```astro
---
import { getGlobalVariable } from '../utils/global-variables-api';
const siteName = await getGlobalVariable('siteName', { fallback: 'My Site' });
---

<section>
  <h1>Welcome to {siteName}</h1>
  <p>{siteName} is the best CMS</p>
</section>
```

Both approaches work simultaneously - use templates for data-driven content and the API for component logic.

## Troubleshooting

### Common Issues

1. **"Global variables cache not initialized"**
   - Call `await refreshGlobalVariablesCache()` before using sync API
   - Or use async API instead

2. **Variables not updating**
   - In development, call `refreshGlobalVariablesCache()` to reload
   - Check that variable names match exactly (case-sensitive)

3. **Translation not working**
   - Verify locale exists in `translations` object
   - Check that translation key matches root variable name

4. **Validation errors**
   - Check variable names follow naming rules
   - Avoid using reserved keys (`translations`, `updatedAt`)

### Debug Information

```astro
---
// Get debug information
const validation = await validateGlobalVariables();
const availableVars = await listGlobalVariables();
---

{import.meta.env.DEV && (
  <pre>{JSON.stringify({ validation, availableVars }, null, 2)}</pre>
)}
```
