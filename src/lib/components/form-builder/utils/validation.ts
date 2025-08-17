import type { FormField, SchemaItem, FieldBuilder } from '../types';

export interface ValidationError {
    field: string;
    label: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * Converts a SchemaItem to FormField for validation
 */
function schemaItemToFormField(item: SchemaItem): FormField | null {
    // Check if it's a tabs container first (these should not be treated as fields)
    if ('tabsContainer' in item || 'tabs' in item) {
        return null;
    }

    // Check if it's a grid layout
    if ('schema' in item && 'columns' in item) {
        return null;
    }

    if ('toJSON' in item && typeof item.toJSON === 'function') {
        // It's a FieldBuilder
        return (item as FieldBuilder).toJSON();
    } else if ('type' in item && 'name' in item && 'label' in item) {
        // It's already a FormField
        return item as FormField;
    }

    // It's a tabs container, grid layout, etc. - skip validation
    return null;
}

/**
 * Extracts FormFields from a schema, handling nested structures
 * Only returns fields that actually need validation (required fields or special types)
 */
function extractFormFields(schema: SchemaItem[]): FormField[] {
    const fields: FormField[] = [];

    for (const item of schema) {
        // Check for tabs container first
        if ('tabsContainer' in item && item.tabsContainer && typeof item.tabsContainer === 'object' && 'tabs' in item.tabsContainer) {
            const tabsContainer = item.tabsContainer as any;
            if (Array.isArray(tabsContainer.tabs)) {
                for (const tab of tabsContainer.tabs) {
                    if ('schema' in tab && Array.isArray(tab.schema)) {
                        fields.push(...extractFormFields(tab.schema));
                    }
                }
            }
            continue;
        }

        const field = schemaItemToFormField(item);
        if (field) {
            // Only include fields that need validation
            if (shouldValidateField(field)) {
                fields.push(field);
            }
        } else if ('schema' in item && Array.isArray(item.schema)) {
            // Handle nested schemas (like grids)
            fields.push(...extractFormFields(item.schema));
        } else if ('tabs' in item && Array.isArray(item.tabs)) {
            // Handle tab containers (direct tabs property)
            for (const tab of item.tabs) {
                if ('schema' in tab && Array.isArray(tab.schema)) {
                    fields.push(...extractFormFields(tab.schema));
                }
            }
        }
    }

    return fields;
}

/**
 * Determines if a field needs validation
 * Only validate if:
 * 1. Field is required (need to check if empty)
 * 2. Field type needs format validation (email, url, tel)
 */
function shouldValidateField(field: FormField): boolean {
    if (field.required) return true;

    // Only validate special types that need format checking
    const typesNeedingValidation = ['email', 'url', 'tel'];
    return typesNeedingValidation.includes(field.type);
}

/**
 * Check if a value is considered empty
 */
function isEmptyValue(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
}

/**
 * Validates a single field value against its field configuration
 * Only validates required fields and special types (email, url, tel)
 */
export function validateField(field: FormField, value: any): string | null {
    // Skip validation for disabled or readonly fields
    if (field.disabled || field.readonly) {
        return null;
    }

    // Required field validation
    if (field.required && isEmptyValue(value)) {
        return `${field.label} is required`;
    }

    // Skip other validations if value is empty
    if (isEmptyValue(value)) {
        return null;
    }

    // Only validate specific types that need format validation
    switch (field.type) {
        case 'email':
            return validateEmail(field, value);
        case 'url':
            return validateUrl(field, value);
        case 'tel':
            return validateTel(field, value);
        default:
            // All other types don't need validation
            return null;
    }
}

/**
 * Validates all fields in a form data object
 */
export function validateFormData(schema: SchemaItem[], formData: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    const fields = extractFormFields(schema);

    function validateNestedFields(fields: FormField[], data: Record<string, any>, prefix = '') {
        fields.forEach(field => {
            const fieldKey = prefix ? `${prefix}.${field.name}` : field.name;
            const value = data[field.name];

            // Handle repeater fields
            if (field.type === 'repeater' && Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (field.schema && Array.isArray(field.schema)) {
                        const nestedFields = extractFormFields(field.schema);
                        validateNestedFields(nestedFields, item, `${fieldKey}[${index}]`);
                    }
                });
                return;
            }

            const error = validateField(field, value);
            if (error) {
                errors.push({
                    field: fieldKey,
                    label: field.label,
                    message: error
                });
            }
        });
    }

    validateNestedFields(fields, formData);

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate email fields
 */
function validateEmail(field: FormField, value: string): string | null {
    if (typeof value !== 'string') {
        return `${field.label} must be text`;
    }

    // Email-specific validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return `${field.label} must be a valid email address`;
    }

    return null;
}

/**
 * Validate URL fields
 */
function validateUrl(field: FormField, value: string): string | null {
    if (typeof value !== 'string') {
        return `${field.label} must be text`;
    }

    // URL-specific validation
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(value)) {
        return `${field.label} must be a valid URL (starting with http:// or https://)`;
    }

    return null;
}

/**
 * Validate telephone fields
 */
function validateTel(field: FormField, value: string): string | null {
    if (typeof value !== 'string') {
        return `${field.label} must be text`;
    }

    // Basic phone number validation (allows various formats)
    const telRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (!telRegex.test(value)) {
        return `${field.label} must be a valid phone number`;
    }

    return null;
}
