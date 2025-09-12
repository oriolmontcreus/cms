# Translation System

This document describes the new translation management system that replaces the legacy "Translation mode" toggle.

## Overview

The translation system provides a centralized way to manage content translations across multiple languages. Instead of switching between "Content" and "Translation" modes within individual page editors, all translation work is now handled through a dedicated translation management interface.

## Features

### Translation Dashboard (`/translations`)

The main translation dashboard provides:

- **Overview statistics**: Number of available languages, translatable fields, completed translations, and missing translations
- **Progress tracking**: Visual progress bars showing translation completion percentages
- **Language-specific breakdown**: Individual progress for each language with quick access to manage translations
- **Quick actions**: Easy access to common translation workflows

### Translation Wizard (`/translations/wizard`)

The step-by-step translation wizard guides users through the translation process:

1. **Mode Selection**: Choose between:
   - **Fill Missing Translations**: Complete empty translation fields
   - **Review & Update Existing**: Modify existing translations

2. **Language Selection**: Choose which language to work on

3. **Content Selection**: Select specific pages and/or global variables to translate

4. **Translation Interface**: Individual field translation with:
   - Original content display
   - Translation input (text field or textarea based on content length)
   - Progress tracking
   - Navigation between fields
   - Skip functionality for optional translations

5. **Completion**: Summary and confirmation of saved translations

## How It Works

### Data Structure

Translations are stored in the `translations` field of each component's `formData`:

```json
{
  "formData": {
    "title": "Welcome",
    "description": "This is the homepage",
    "translations": {
      "es": {
        "title": "Bienvenido",
        "description": "Esta es la página de inicio"
      },
      "fr": {
        "title": "Bienvenue",
        "description": "Ceci est la page d'accueil"
      }
    }
  }
}
```

### Translatable Fields

Fields are considered translatable based on the component schema definition. The system identifies translatable fields by:

1. Excluding the `translations` field itself
2. Checking for fields marked with the `translatable()` modifier in component schemas
3. Filtering out system fields like `updatedAt`

### Saving Process

The translation wizard saves translations by:

1. **Grouping changes** by page/component and language
2. **Merging with existing data** to preserve other translations and content
3. **Using existing services**:
   - `updateGlobalVariables()` for global variable translations
   - `handleUpdateComponents()` for page component translations

### API Integration

The system integrates with existing CMS APIs:

- **Pages**: Uses the page service to update component translations
- **Global Variables**: Uses the global variables service to update translations
- **File handling**: Maintains existing file upload/management functionality

## Usage Guidelines

### For Content Managers

1. **Creating translations**:
   - Navigate to the Translations page
   - Use the Translation Wizard to systematically work through missing translations
   - Focus on one language at a time for better workflow

2. **Updating translations**:
   - Use the "Review & Update Existing" mode in the wizard
   - Or access specific languages directly from the dashboard

3. **Monitoring progress**:
   - Check the dashboard for overall translation health
   - Use progress indicators to prioritize work
   - Monitor completion percentages by language

### For Developers

1. **Adding translatable fields**:
   - Mark fields as translatable in component schemas using the `translatable()` modifier
   - Ensure fields follow the standard translation data structure

2. **Accessing translations**:
   - Translations are stored alongside regular content in component `formData`
   - Use the `translations[locale][fieldName]` path to access translated content
   - Fall back to default content when translations are missing

## Benefits Over Legacy System

### User Experience
- **Clearer workflow**: No confusion about modes or context switching
- **Centralized management**: All translation work in one place
- **Better visibility**: Clear progress tracking and completion status
- **Guided process**: Step-by-step wizard reduces cognitive load

### Technical
- **Simplified codebase**: Removed complex mode switching logic from editors
- **Scalable**: Easy to add new languages and track completion
- **Maintainable**: Centralized translation logic
- **Consistent**: Uses existing save/update patterns

### Content Management
- **Systematic approach**: Process large translation tasks methodically
- **Progress tracking**: See what's complete and what needs work
- **Batch operations**: Work through multiple fields efficiently
- **Quality control**: Review and update existing translations easily

## Migration Notes

The new system maintains full backward compatibility with existing translation data. No migration is required - existing translations continue to work without changes.

The legacy translation mode toggles have been removed from:
- Page editors (`/pages/[...slug]`)
- Global variables editor (`/global-variables`)

All translation functionality is now available through the dedicated translation management system at `/translations`.