# Global Variables API - Simple Usage

Clean and minimal API for accessing global variables in Astro components.

## Quick Start

```astro
---
import { getGlobalVariable, getGlobalVariables } from '../utils/global-variables';

// Get a single variable
const siteName = await getGlobalVariable('siteName');

// Get with fallback
const theme = await getGlobalVariable('theme', { fallback: 'dark' });

// Get with locale
const siteNameInSpanish = await getGlobalVariable('siteName', { locale: 'es-ES' });

// Get multiple variables
const { siteName, contactEmail } = await getGlobalVariables(['siteName', 'contactEmail']);
---

<h1>{siteName}</h1>
```

## API Reference

### Functions

- `getGlobalVariable(key, options?)` - Get a single variable
- `getGlobalVariables(keys, options?)` - Get multiple variables

### Options

```typescript
{
  locale?: string;    // Get translation for specific locale
  fallback?: any;     // Return this if variable not found
}
```

## Examples

```astro
---
import { getGlobalVariable, getGlobalVariables } from '../utils/global-variables';

// Basic usage
const siteName = await getGlobalVariable('siteName');

// With locale support
const welcomeMessage = await getGlobalVariable('welcome', { locale: 'es-ES' });

// With fallback
const maxItems = await getGlobalVariable('maxItems', { fallback: 10 });

// Multiple variables
const { siteName, theme, contactEmail } = await getGlobalVariables([
  'siteName', 'theme', 'contactEmail'
]);
---
```

## How It Works

This API works alongside your existing template system:

- **Template usage**: `{{siteName}}` in JSON data (existing feature)
- **Direct usage**: `await getGlobalVariable('siteName')` in code (new feature)

Both use the same data source (`globalVariables.json`) and support the same translation system.

That's it! Simple and clean. 🎉
