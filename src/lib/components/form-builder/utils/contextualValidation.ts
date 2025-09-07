import type { SchemaItem, FormField, TabsContainer } from '../types';
import type { ValidationError, ValidationContext } from './validation';
import { validateFormData, validateField } from './validation';
import { SCHEMA_TYPES } from '../constants';

/**
 * Enhanced validation that tracks tab and component context
 */
export function validateFormDataWithContext(
    schema: SchemaItem[],
    formData: Record<string, any>,
    baseContext: ValidationContext
): ValidationError[] {
    const errors: ValidationError[] = [];

    function processSchemaItems(
        items: SchemaItem[],
        data: Record<string, any>,
        context: ValidationContext,
        prefix = ''
    ) {
        for (const item of items) {
            // Handle tabs container
            if (item && typeof item === 'object' && 'type' in item && item.type === SCHEMA_TYPES.TABS_CONTAINER && 'tabs' in item) {
                console.log('Found tabs container:', item);
                const tabsContainer = item as TabsContainer;
                for (const tab of tabsContainer.tabs) {
                    if (!tab.hidden && tab.schema) {
                        console.log('Processing tab:', tab.name, 'with schema:', tab.schema);
                        const tabContext: ValidationContext = {
                            ...context,
                            tabName: tab.name
                        };
                        processSchemaItems(tab.schema, data, tabContext, prefix);
                    }
                }
                continue;
            }

            // Handle grid layouts
            if (item && typeof item === 'object' && 'type' in item && item.type === SCHEMA_TYPES.GRID && 'schema' in item) {
                processSchemaItems(item.schema, data, context, prefix);
                continue;
            }

            // Handle form fields
            const field = convertSchemaItemToFormField(item);
            if (field && shouldValidateField(field)) {
                const fieldKey = prefix ? `${prefix}.${field.name}` : field.name;
                const value = data[field.name];

                // Handle repeater fields
                if (field.type === 'repeater' && Array.isArray(value)) {
                    value.forEach((item, index) => {
                        if (field.schema && Array.isArray(field.schema)) {
                            const repeaterContext: ValidationContext = {
                                ...context,
                                fieldPath: fieldKey,
                                isInRepeater: true,
                                repeaterIndex: index
                            };
                            processSchemaItems(
                                field.schema,
                                item,
                                repeaterContext,
                                `${fieldKey}[${index}]`
                            );
                        }
                    });
                    continue;
                }

                const error = validateField(field, value);
                if (error) {
                    errors.push({
                        field: fieldKey,
                        label: field.label,
                        message: error,
                        componentId: context.componentId,
                        componentLabel: context.componentLabel,
                        tabName: context.tabName,
                        fieldPath: context.fieldPath,
                        isInRepeater: context.isInRepeater,
                        repeaterIndex: context.repeaterIndex
                    });
                }
            }
        }
    }

    processSchemaItems(schema, formData, baseContext);
    return errors;
}

function convertSchemaItemToFormField(item: SchemaItem): FormField | null {
    if (!item || typeof item !== 'object') return null;

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
        return (item as any).toJSON();
    } else if ('type' in item && 'name' in item && 'label' in item) {
        // It's already a FormField
        return item as FormField;
    }

    // It's a container or layout - skip validation
    return null;
}

function shouldValidateField(field: FormField): boolean {
    if (field.required) return true;

    // Only validate special types that need format checking
    const typesNeedingValidation = ['email', 'url', 'tel'];
    return typesNeedingValidation.includes(field.type);
}
