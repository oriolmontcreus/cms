# Form Builder Validation

This document describes how validation works in the Form Builder component and important architectural decisions.

## Validation Behavior by Mode

### Content Mode
- **Full validation enabled**: All required fields and format validations are enforced
- **Purpose**: Ensures data integrity for the primary content structure
- **When it runs**: Before saving content data

### Translation Mode
- **Validation disabled**: No validation is performed when saving translations
- **Reasoning**: 
  - Translation data has a different structure (`{ "locale": { "field": "value" } }`) than content data (`{ "field": "value" }`)
  - The validation logic expects the content data structure, causing false positives in translation mode
  - Original content should have already been validated when initially saved in content mode
  - Translations are derivatives of already-validated content

## Technical Implementation

The validation logic is implemented in:
- **Main validation function**: `FormBuilder.svelte` - `handleSubmit()` method
- **Validation utilities**: `utils/validation.ts`

```javascript
// In FormBuilder.svelte handleSubmit() method
// Skip validation in translation mode since we're only saving translations
// The content validation should have already passed when the original content was saved
if (mode === RenderMode.CONTENT) {
    const isValid = await validateForm(formData);
    if (!isValid) {
        return; // Don't save if validation fails
    }
}
```

## Known Issues & Future Improvements

### Current Approach Limitations
- **No validation in translation mode**: This means users could potentially save invalid translations (e.g., invalid email formats in translated fields)
- **Structural assumption**: Assumes all content was properly validated initially, which may not always be true

### Alternative Approaches to Consider
1. **Locale-specific validation**: Validate each locale's data individually in translation mode
2. **Schema-aware translation validation**: Modify validation logic to understand translation data structure
3. **Field-type specific validation**: Only validate format-sensitive fields (email, URL) in translation mode, skip required field checks

### Implementation Considerations
If implementing locale-specific validation in the future:

```javascript
// Potential future approach
if (mode === RenderMode.TRANSLATION) {
    // Validate each locale's data separately
    for (const [locale, localeData] of Object.entries(translationData[componentId] || {})) {
        const isValid = await validateForm({ [componentId]: localeData });
        if (!isValid) return;
    }
}
```

## Related Files
- `src/lib/components/form-builder/FormBuilder.svelte`
- `src/lib/components/form-builder/utils/validation.ts`
- `src/routes/global-variables/+page.svelte`

## Decision History

**Date**: September 6, 2025  
**Issue**: Validation errors in translation mode showing false positives  
**Root Cause**: Translation data structure mismatch with validation expectations  
**Decision**: Disable validation in translation mode  
**Trade-offs**: Prioritized user experience over comprehensive validation coverage
