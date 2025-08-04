import type { FormField, Layout, SchemaItem, TabsContainer } from '../types';
import { RenderMode } from '../types';
import { SCHEMA_TYPES, DEFAULT_VALUES } from '../constants';
import { CMS_LOCALE } from '@/lib/shared/env';
import type { Component } from '@/lib/shared/types/pages.type';

/**
 * Optimized schema processor that minimizes redundant operations
 * and provides efficient caching for component analysis
 */

interface ProcessedSchema {
    allFields: FormField[];
    translatableFields: FormField[];
    repeaterFields: FormField[];
    hasFilamentTabs: boolean;
    hasMixedSchema: boolean;
    fieldByName: Map<string, FormField>;
}

// Single cache for all processed schemas - more memory efficient
const processedSchemaCache = new WeakMap<any, ProcessedSchema>();

/**
 * Convert schema item to FormField if possible - optimized version
 */
function toFormField(item: any): FormField | null {
    if (!item || typeof item !== 'object') return null;

    if (typeof item.toJSON === 'function') {
        return item.toJSON();
    }

    if ('name' in item && 'type' in item) {
        return item as FormField;
    }

    return null;
}

/**
 * Extract all fields from schema efficiently with single traversal
 */
function extractAllFields(schema: Layout | SchemaItem[]): FormField[] {
    const fields: FormField[] = [];

    function traverse(items: any) {
        if (Array.isArray(items)) {
            for (const item of items) {
                traverse(item);
            }
            return;
        }

        if (!items || typeof items !== 'object') return;

        // Handle containers
        if (items.type === SCHEMA_TYPES.GRID && items.schema) {
            traverse(items.schema);
            return;
        }

        if (items.type === SCHEMA_TYPES.TABS_CONTAINER && items.tabs) {
            for (const tab of items.tabs) {
                traverse(tab.schema);
            }
            return;
        }

        // Handle individual field
        const field = toFormField(items);
        if (field) {
            fields.push(field);

            // Handle nested schema in repeater fields
            if (field.type === 'repeater' && field.schema) {
                traverse(field.schema);
            }
        }
    }

    traverse(schema);
    return fields;
}

/**
 * Process component schema with comprehensive analysis in single pass
 */
export function processComponentSchema(component: any): ProcessedSchema {
    if (processedSchemaCache.has(component)) {
        return processedSchemaCache.get(component)!;
    }

    const schema = component.schema;
    const allFields = extractAllFields(schema);

    // Single pass filtering - more efficient than multiple filters
    const translatableFields: FormField[] = [];
    const repeaterFields: FormField[] = [];
    const fieldByName = new Map<string, FormField>();

    for (const field of allFields) {
        fieldByName.set(field.name, field);

        if (field.translatable === true) {
            translatableFields.push(field);
        }

        if (field.type === 'repeater' && field.schema) {
            const nestedFields = extractAllFields(field.schema);
            if (nestedFields.some(f => f.translatable === true)) {
                repeaterFields.push(field);
            }
        }
    }

    // Analyze schema structure
    const hasFilamentTabs = Array.isArray(schema) &&
        schema.some((item: any) => item?.type === SCHEMA_TYPES.TABS_CONTAINER);
    const hasMixedSchema = Array.isArray(schema) &&
        schema.some((item: any) => item?.type === SCHEMA_TYPES.TABS_SELECTOR);

    const result: ProcessedSchema = {
        allFields,
        translatableFields,
        repeaterFields,
        hasFilamentTabs,
        hasMixedSchema,
        fieldByName
    };

    processedSchemaCache.set(component, result);
    return result;
}

/**
 * Get default value for field type - optimized with lookup table
 */
const fieldDefaultValues = new Map<string, any>([
    ['number', DEFAULT_VALUES.NULL],
    ['toggle', DEFAULT_VALUES.FALSE],
    ['dateRange', DEFAULT_VALUES.DATE_RANGE],
    ['color', DEFAULT_VALUES.COLOR],
    ['richtext', DEFAULT_VALUES.EMPTY_STRING]
]);

export function getFieldDefaultValue(field: FormField): any {
    if (field.type === 'select') {
        return field.multiple ? DEFAULT_VALUES.EMPTY_ARRAY : DEFAULT_VALUES.EMPTY_STRING;
    }

    return fieldDefaultValues.get(field.type) ?? DEFAULT_VALUES.EMPTY_STRING;
}

/**
 * Initialize form data efficiently with batch processing
 */
export function initializeFormDataOptimized(
    components: any[],
    existingComponents: Component[]
): Record<string, any> {
    const formData: Record<string, any> = {};

    // Create lookup map for existing components for O(1) access
    const existingLookup = new Map(
        existingComponents.map(c => [c.instanceId, c])
    );

    for (const componentInstance of components) {
        const { allFields, fieldByName } = processComponentSchema(componentInstance.component);
        const existingComponent = existingLookup.get(componentInstance.id);
        const componentData: Record<string, any> = {};

        for (const field of allFields) {
            const existingValue = existingComponent?.formData[field.name];
            componentData[field.name] = existingValue !== undefined ?
                existingValue : getFieldDefaultValue(field);
        }

        formData[componentInstance.id] = componentData;
    }

    return formData;
}

/**
 * Initialize translation data with optimized structure building
 */
export function initializeTranslationDataOptimized(
    components: any[],
    existingComponents: Component[],
    locales: readonly { code: string; name: string }[]
): Record<string, Record<string, any>> {
    const translationData: Record<string, Record<string, any>> = {};

    // Create lookup map for existing components
    const existingLookup = new Map(
        existingComponents.map(c => [c.instanceId, c])
    );

    for (const componentInstance of components) {
        const { translatableFields, repeaterFields } = processComponentSchema(componentInstance.component);
        const existingComponent = existingLookup.get(componentInstance.id);

        translationData[componentInstance.id] = {};

        for (const locale of locales) {
            const localeData: Record<string, any> = {};

            // Handle regular translatable fields
            for (const field of translatableFields) {
                if (field.type === 'repeater') continue;

                const existingTranslation = existingComponent?.formData?.translations?.[locale.code]?.[field.name];

                if (existingTranslation !== undefined) {
                    localeData[field.name] = existingTranslation;
                } else if (locale.code === CMS_LOCALE) {
                    localeData[field.name] = existingComponent?.formData?.[field.name] ?? getFieldDefaultValue(field);
                } else {
                    localeData[field.name] = getFieldDefaultValue(field);
                }
            }

            // Handle repeater fields for non-CMS locales
            if (locale.code !== CMS_LOCALE) {
                for (const repeaterField of repeaterFields) {
                    const repeaterItems = existingComponent?.formData?.[repeaterField.name] || [];
                    const nestedTranslatableFields = extractAllFields(repeaterField.schema || [])
                        .filter(f => f.translatable === true);

                    for (let itemIndex = 0; itemIndex < repeaterItems.length; itemIndex++) {
                        const key = `${repeaterField.name}_${itemIndex}`;
                        const itemData: Record<string, any> = {};

                        for (const nestedField of nestedTranslatableFields) {
                            const existingTranslations = existingComponent?.formData?.translations?.[locale.code];
                            let existingTranslation;

                            // Try array format first, then indexed format
                            if (existingTranslations) {
                                if (Array.isArray(existingTranslations[repeaterField.name]) &&
                                    existingTranslations[repeaterField.name][itemIndex]) {
                                    existingTranslation = existingTranslations[repeaterField.name][itemIndex][nestedField.name];
                                } else if (existingTranslations[key]) {
                                    existingTranslation = existingTranslations[key][nestedField.name];
                                }
                            }

                            itemData[nestedField.name] = existingTranslation !== undefined ?
                                existingTranslation : getFieldDefaultValue(nestedField);
                        }

                        localeData[key] = itemData;
                    }
                }
            }

            translationData[componentInstance.id][locale.code] = localeData;
        }
    }

    return translationData;
}

/**
 * Filter schema by mode efficiently
 */
export function filterSchemaByModeOptimized(schema: SchemaItem[], mode: RenderMode): SchemaItem[] {
    // First filter out hidden items for all modes
    const visibleSchema = schema.filter(item => {
        const field = toFormField(item);
        if (field) return !field.hidden;
        // Check for hidden structural elements
        if (item && typeof item === 'object' && 'type' in item && 'hidden' in item) {
            return !item.hidden;
        }
        return true; // Other items that don't have hidden property
    });

    if (mode === RenderMode.CONTENT) {
        return visibleSchema;
    }

    // Translation mode - only include items with translatable content
    return visibleSchema.filter(item => hasTranslatableContent(item));
}

function hasTranslatableContent(item: SchemaItem): boolean {
    if (!item || typeof item !== 'object') return false;

    // Handle containers
    if ('type' in item) {
        if (item.type === SCHEMA_TYPES.GRID && 'schema' in item && !item.hidden) {
            return (item.schema as FormField[]).some(f =>
                !f.hidden && (f.translatable === true ||
                    (f.type === 'repeater' && f.schema && hasTranslatableFieldsInSchema(f.schema)))
            );
        }

        if (item.type === SCHEMA_TYPES.TABS_CONTAINER && 'tabs' in item && !item.hidden) {
            return (item as TabsContainer).tabs.some(tab =>
                !tab.hidden && tab.schema.some(schemaItem => hasTranslatableContent(schemaItem))
            );
        }
    }

    // Handle individual fields
    const field = toFormField(item);
    if (field && !field.hidden) {
        if (field.translatable === true) return true;

        if (field.type === 'repeater' && field.schema) {
            return hasTranslatableFieldsInSchema(field.schema);
        }
    }

    return false;
}

function hasTranslatableFieldsInSchema(schema: SchemaItem[]): boolean {
    return extractAllFields(schema).some(f => f.translatable === true);
}

/**
 * Export convenience functions that use the optimized processor
 */
export function getComponentAnalysis(component: any) {
    return processComponentSchema(component);
}

export function usesFilamentTabsOptimized(component: any): boolean {
    return processComponentSchema(component).hasFilamentTabs;
}

export function usesMixedSchemaOptimized(component: any): boolean {
    return processComponentSchema(component).hasMixedSchema;
}