import type { FormField, SchemaItem, FieldBuilder } from '../types';
import { SCHEMA_TYPES } from '../constants';

export interface ValidationError {
    field: string;
    label: string;
    message: string;
    componentId?: string;
    componentLabel?: string;
    tabName?: string;
    fieldPath?: string; // For nested fields like repeaters
    isInRepeater?: boolean;
    repeaterIndex?: number;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export interface ValidationContext {
    componentId?: string;
    componentLabel?: string;
    tabName?: string;
    fieldPath?: string;
    isInRepeater?: boolean;
    repeaterIndex?: number;
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
 * Extracts FormFields from a schema, handling nested structures and preserving context
 * Returns fields with their contextual information (tab names, etc.)
 */
function extractFormFieldsWithContext(schema: SchemaItem[], baseContext: ValidationContext = {}): Array<{ field: FormField, context: ValidationContext }> {
    const fieldsWithContext: Array<{ field: FormField, context: ValidationContext }> = [];

    for (const item of schema) {
        // Check for tabs container first
        if ('tabsContainer' in item && item.tabsContainer && typeof item.tabsContainer === 'object' && 'tabs' in item.tabsContainer) {
            const tabsContainer = item.tabsContainer as any;
            if (Array.isArray(tabsContainer.tabs)) {
                for (const tab of tabsContainer.tabs) {
                    if ('schema' in tab && Array.isArray(tab.schema)) {
                        const tabContext = { ...baseContext, tabName: tab.name };
                        fieldsWithContext.push(...extractFormFieldsWithContext(tab.schema, tabContext));
                    }
                }
            }
            continue;
        }

        // Check for direct tabs property (newer format)
        if (item && typeof item === 'object' && 'type' in item && item.type === SCHEMA_TYPES.TABS_CONTAINER && 'tabs' in item) {
            const tabsContainer = item as any;
            if (Array.isArray(tabsContainer.tabs)) {
                for (const tab of tabsContainer.tabs) {
                    if ('schema' in tab && Array.isArray(tab.schema) && !tab.hidden) {
                        const tabContext = { ...baseContext, tabName: tab.name };
                        fieldsWithContext.push(...extractFormFieldsWithContext(tab.schema, tabContext));
                    }
                }
            }
            continue;
        }

        const field = schemaItemToFormField(item);
        if (field) {
            // Only include fields that need validation
            if (shouldValidateField(field)) {
                fieldsWithContext.push({ field, context: { ...baseContext } });
            }
        } else if ('schema' in item && Array.isArray(item.schema)) {
            // Handle nested schemas (like grids)
            fieldsWithContext.push(...extractFormFieldsWithContext(item.schema, baseContext));
        } else if ('tabs' in item && Array.isArray((item as any).tabs)) {
            // Handle tab containers (direct tabs property)
            const tabsArray = (item as any).tabs;
            for (const tab of tabsArray) {
                if ('schema' in tab && Array.isArray(tab.schema)) {
                    const tabContext = { ...baseContext, tabName: tab.name };
                    fieldsWithContext.push(...extractFormFieldsWithContext(tab.schema, tabContext));
                }
            }
        }
    }

    return fieldsWithContext;
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
 * Validates all fields in a form data object with enhanced context tracking
 */
export function validateFormData(
    schema: SchemaItem[],
    formData: Record<string, any>,
    context?: ValidationContext
): ValidationResult {
    const errors: ValidationError[] = [];
    const fieldsWithContext = extractFormFieldsWithContext(schema, context);

    function validateNestedFields(
        fieldsWithContext: Array<{ field: FormField, context: ValidationContext }>,
        data: Record<string, any>,
        prefix = '',
        currentContext?: ValidationContext
    ) {
        fieldsWithContext.forEach(({ field, context: fieldContext }) => {
            const fieldKey = prefix ? `${prefix}.${field.name}` : field.name;
            const value = data[field.name];

            // Handle grid layouts
            if (field.type === 'repeater' && Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (field.schema && Array.isArray(field.schema)) {
                        const nestedFieldsWithContext = extractFormFieldsWithContext(field.schema, fieldContext);
                        const repeaterContext: ValidationContext = {
                            ...fieldContext,
                            fieldPath: fieldKey,
                            isInRepeater: true,
                            repeaterIndex: index
                        };
                        validateNestedFields(nestedFieldsWithContext, item, `${fieldKey}[${index}]`, repeaterContext);
                    }
                });
                return;
            }

            const error = validateField(field, value);
            if (error) {
                const validationError: ValidationError = {
                    field: fieldKey,
                    label: field.label,
                    message: error,
                    componentId: fieldContext?.componentId || currentContext?.componentId,
                    componentLabel: fieldContext?.componentLabel || currentContext?.componentLabel,
                    tabName: fieldContext?.tabName || currentContext?.tabName,
                    fieldPath: fieldContext?.fieldPath || currentContext?.fieldPath,
                    isInRepeater: fieldContext?.isInRepeater || currentContext?.isInRepeater,
                    repeaterIndex: fieldContext?.repeaterIndex || currentContext?.repeaterIndex
                };
                errors.push(validationError);
            }
        });
    }

    validateNestedFields(fieldsWithContext, formData, '', context);

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
