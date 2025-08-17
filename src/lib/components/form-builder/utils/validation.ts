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
 */
function extractFormFields(schema: SchemaItem[]): FormField[] {
    const fields: FormField[] = [];

    console.log(`[extractFormFields] Processing schema:`, schema);

    for (const item of schema) {
        console.log(`[extractFormFields] Processing item:`, item);

        // Check for tabs container first
        if ('tabsContainer' in item && item.tabsContainer && typeof item.tabsContainer === 'object' && 'tabs' in item.tabsContainer) {
            console.log(`[extractFormFields] Found tabs container via tabsContainer property:`, item.tabsContainer);
            const tabsContainer = item.tabsContainer as any;
            if (Array.isArray(tabsContainer.tabs)) {
                for (const tab of tabsContainer.tabs) {
                    console.log(`[extractFormFields] Processing tab:`, tab);
                    if ('schema' in tab && Array.isArray(tab.schema)) {
                        console.log(`[extractFormFields] Processing tab schema:`, tab.schema);
                        fields.push(...extractFormFields(tab.schema));
                    }
                }
            }
            continue;
        }

        const field = schemaItemToFormField(item);
        if (field) {
            console.log(`[extractFormFields] Found field:`, field.name, field.type);
            fields.push(field);
        } else if ('schema' in item && Array.isArray(item.schema)) {
            // Handle nested schemas (like grids)
            console.log(`[extractFormFields] Found nested schema in:`, item);
            fields.push(...extractFormFields(item.schema));
        } else if ('tabs' in item && Array.isArray(item.tabs)) {
            // Handle tab containers (direct tabs property)
            console.log(`[extractFormFields] Found tabs container with direct tabs:`, item);
            for (const tab of item.tabs) {
                console.log(`[extractFormFields] Processing tab:`, tab);
                if ('schema' in tab && Array.isArray(tab.schema)) {
                    console.log(`[extractFormFields] Processing tab schema:`, tab.schema);
                    fields.push(...extractFormFields(tab.schema));
                }
            }
        } else {
            console.log(`[extractFormFields] Skipping item (not a field):`, item);
        }
    }

    console.log(`[extractFormFields] Returning fields:`, fields.map(f => ({ name: f.name, type: f.type })));
    return fields;
}/**
 * Validates a single field value against its field configuration
 */
export function validateField(field: FormField, value: any): string | null {
    console.log(`[validateField] Validating field:`, {
        name: field.name,
        type: field.type,
        label: field.label,
        value,
        required: field.required
    });

    // Skip validation for disabled or readonly fields
    if (field.disabled || field.readonly) {
        console.log(`[validateField] Skipping disabled/readonly field: ${field.name}`);
        return null;
    }

    // Required field validation
    if (field.required && isEmptyValue(value)) {
        const errorMsg = `${field.label} is required`;
        console.log(`[validateField] Required field empty: ${field.name} - ${errorMsg}`);
        return errorMsg;
    }

    // Skip other validations if value is empty and not required
    if (isEmptyValue(value)) {
        console.log(`[validateField] Empty value for non-required field: ${field.name}`);
        return null;
    }

    // Type-specific validations
    console.log(`[validateField] Running type-specific validation for: ${field.type}`);
    switch (field.type) {
        case 'text':
        case 'textarea':
            return validateText(field, value);
        case 'email':
            const emailResult = validateEmail(field, value);
            console.log(`[validateField] Email validation result for ${field.name}:`, emailResult);
            return emailResult;
        case 'url':
            return validateUrl(field, value);
        case 'tel':
            return validateTel(field, value);
        case 'password':
            return validatePassword(field, value);
        case 'number':
            return validateNumber(field, value);
        case 'date':
            return validateDate(field, value);
        case 'dateRange':
            return validateDateRange(field, value);
        case 'file':
            return validateFile(field, value);
        case 'tags':
            return validateTags(field, value);
        case 'select':
            return validateSelect(field, value);
        default:
            return null;
    }
}

/**
 * Validates all fields in a form data object
 */
export function validateFormData(schema: SchemaItem[], formData: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    const fields = extractFormFields(schema);

    console.log(`[validateFormData] Extracted ${fields.length} fields from schema:`, fields.map(f => ({ name: f.name, type: f.type })));
    console.log(`[validateFormData] Form data:`, formData);

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
 * Check if a value is considered empty
 */
function isEmptyValue(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length === 0;
    return false;
}

/**
 * Validate text/textarea fields
 */
function validateText(field: FormField, value: string): string | null {
    const length = value.length;

    if (field.min !== undefined && length < field.min) {
        return `${field.label} must be at least ${field.min} characters`;
    }

    if (field.max !== undefined && length > field.max) {
        return `${field.label} must be no more than ${field.max} characters`;
    }

    if (field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
            return `${field.label} format is invalid`;
        }
    }

    return null;
}

/**
 * Validate email fields
 */
function validateEmail(field: FormField, value: string): string | null {
    console.log(`[validateEmail] Validating email field ${field.name}:`, { value, type: typeof value });

    if (typeof value !== 'string') {
        const errorMsg = `${field.label} must be text`;
        console.log(`[validateEmail] Type error:`, errorMsg);
        return errorMsg;
    }

    // First apply text validations (length, pattern)
    const textError = validateText(field, value);
    if (textError) {
        console.log(`[validateEmail] Text validation failed:`, textError);
        return textError;
    }

    // Email-specific validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(value);
    console.log(`[validateEmail] Email regex test result:`, { value, isValidEmail, regex: emailRegex.source });

    if (!isValidEmail) {
        const errorMsg = `${field.label} must be a valid email address`;
        console.log(`[validateEmail] Email validation failed:`, errorMsg);
        return errorMsg;
    }

    console.log(`[validateEmail] Email validation passed for:`, value);
    return null;
}

/**
 * Validate URL fields
 */
function validateUrl(field: FormField, value: string): string | null {
    if (typeof value !== 'string') {
        return `${field.label} must be text`;
    }

    // First apply text validations
    const textError = validateText(field, value);
    if (textError) return textError;

    // URL-specific validation
    try {
        new URL(value);
    } catch {
        return `${field.label} must be a valid URL`;
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

    // First apply text validations
    const textError = validateText(field, value);
    if (textError) return textError;

    // Basic phone number validation (can be customized)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return `${field.label} must be a valid phone number`;
    }

    return null;
}

/**
 * Validate password fields
 */
function validatePassword(field: FormField, value: string): string | null {
    if (typeof value !== 'string') {
        return `${field.label} must be text`;
    }

    // Apply text validations with default minimum of 8 for passwords
    const minLength = field.min ?? 8;
    const fieldWithMin = { ...field, min: minLength };
    const textError = validateText(fieldWithMin, value);
    if (textError) return textError;

    return null;
}

/**
 * Validate number fields
 */
function validateNumber(field: FormField, value: number | string): string | null {
    let numericValue: number;

    if (typeof value === 'string') {
        numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
            return `${field.label} must be a valid number`;
        }
    } else if (typeof value === 'number') {
        numericValue = value;
    } else {
        return `${field.label} must be a number`;
    }

    if (field.min !== undefined && numericValue < field.min) {
        return `${field.label} must be at least ${field.min}`;
    }

    if (field.max !== undefined && numericValue > field.max) {
        return `${field.label} must be no more than ${field.max}`;
    }

    if (field.step !== undefined) {
        const min = field.min ?? 0;
        const remainder = (numericValue - min) % field.step;
        if (Math.abs(remainder) > 0.001) { // Allow for floating point precision
            return `${field.label} must be in steps of ${field.step}`;
        }
    }

    return null;
}

/**
 * Validate date fields
 */
function validateDate(field: FormField, value: string): string | null {
    if (typeof value !== 'string') {
        return `${field.label} must be a valid date`;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return `${field.label} must be a valid date`;
    }

    if (field.minDate) {
        const minDate = new Date(field.minDate);
        if (date < minDate) {
            return `${field.label} must be after ${minDate.toLocaleDateString()}`;
        }
    }

    if (field.maxDate) {
        const maxDate = new Date(field.maxDate);
        if (date > maxDate) {
            return `${field.label} must be before ${maxDate.toLocaleDateString()}`;
        }
    }

    return null;
}

/**
 * Validate date range fields
 */
function validateDateRange(field: FormField, value: { start?: string; end?: string }): string | null {
    if (!value || typeof value !== 'object') {
        return `${field.label} must be a valid date range`;
    }

    const { start, end } = value;

    if (start) {
        const startError = validateDate({ ...field, label: `${field.label} start` }, start);
        if (startError) return startError;
    }

    if (end) {
        const endError = validateDate({ ...field, label: `${field.label} end` }, end);
        if (endError) return endError;
    }

    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate >= endDate) {
            return `${field.label} start date must be before end date`;
        }
    }

    return null;
}

/**
 * Validate file fields
 */
function validateFile(field: FormField, value: any): string | null {
    if (!value) return null;

    const files = Array.isArray(value) ? value : [value];

    for (const file of files) {
        // Skip validation for uploaded files (they're already validated)
        if (!(file instanceof File)) continue;

        if (field.allowedMimeTypes?.length && !field.allowedMimeTypes.includes(file.type)) {
            return `${field.label}: File type "${file.type}" is not allowed`;
        }

        if (field.maxFileSize && file.size > field.maxFileSize) {
            const maxSizeMB = (field.maxFileSize / (1024 * 1024)).toFixed(1);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return `${field.label}: File size (${fileSizeMB}MB) exceeds maximum (${maxSizeMB}MB)`;
        }
    }

    return null;
}

/**
 * Validate tags fields
 */
function validateTags(field: FormField, value: string[]): string | null {
    if (!Array.isArray(value)) {
        return `${field.label} must be an array of tags`;
    }

    if (field.required && value.length === 0) {
        return `${field.label} requires at least one tag`;
    }

    if (field.min !== undefined && value.length < field.min) {
        return `${field.label} must have at least ${field.min} tags`;
    }

    if (field.maxTags && value.length > field.maxTags) {
        return `${field.label} must have no more than ${field.maxTags} tags`;
    }

    // Validate individual tags if custom validation is provided
    if (field.validateTag) {
        for (const tag of value) {
            const error = field.validateTag(tag, value);
            if (error) {
                return `${field.label}: ${error}`;
            }
        }
    }

    return null;
}

/**
 * Validate select fields
 */
function validateSelect(field: FormField, value: any): string | null {
    if (field.multiple) {
        if (!Array.isArray(value)) {
            return `${field.label} must be an array`;
        }

        if (field.options) {
            for (const item of value) {
                if (!field.options.includes(item)) {
                    return `${field.label}: "${item}" is not a valid option`;
                }
            }
        }
    } else {
        if (field.options && !field.options.includes(value)) {
            return `${field.label}: "${value}" is not a valid option`;
        }
    }

    return null;
}
