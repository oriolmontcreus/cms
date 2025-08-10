import type { FormField, Layout, SchemaItem, TabsContainer } from '../types';
import { RenderMode } from '../types';
import { SCHEMA_TYPES, DEFAULT_VALUES } from '../constants';
import { CMS_LOCALE } from '@shared/env';
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
 * Convert schema item to proper schema format, handling builder instances
 */
function normalizeSchemaItem(item: any): any {
    if (!item || typeof item !== 'object') return item;

    // Handle builder instances that have toJSON method
    if (typeof item.toJSON === 'function') {
        return item.toJSON();
    }

    return item;
}

/**
 * Normalize entire schema array, converting builder instances to proper format
 */
function normalizeSchema(schema: Layout | SchemaItem[]): any {
    if (Array.isArray(schema)) {
        return schema.map(item => normalizeSchemaItem(item));
    }
    return schema;
}

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
    const normalizedSchema = normalizeSchema(schema);

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

    traverse(normalizedSchema);
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
    // Normalize schema first to handle builder instances
    const normalizedSchema = normalizeSchema(schema);
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

    // Analyze schema structure using normalized schema
    const hasFilamentTabs = Array.isArray(normalizedSchema) &&
        normalizedSchema.some((item: any) => item?.type === SCHEMA_TYPES.TABS_CONTAINER);
    const hasMixedSchema = Array.isArray(normalizedSchema) &&
        normalizedSchema.some((item: any) => item?.type === SCHEMA_TYPES.TABS_SELECTOR);

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

                    for (let itemIndex = 0; itemIndex < repeaterItems.length; itemIndex++) {
                        const key = `${repeaterField.name}_${itemIndex}`;

                        // Process this repeater item and all its nested content
                        const itemData = processRepeaterItemTranslations(
                            repeaterField,
                            itemIndex,
                            existingComponent?.formData?.translations?.[locale.code] || {},
                            locale.code
                        );

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
 * Recursively process repeater item translations to handle infinite nesting
 */
function processRepeaterItemTranslations(
    repeaterField: any,
    itemIndex: number,
    existingTranslations: Record<string, any>,
    localeCode: string
): Record<string, any> {
    const itemData: Record<string, any> = {};
    const key = `${repeaterField.name}_${itemIndex}`;

    // Get all fields in this repeater's schema
    const allFields = extractAllFields(repeaterField.schema || []);
    const translatableFields = allFields.filter(f => f.translatable === true && f.type !== 'repeater');
    const nestedRepeaterFields = allFields.filter(f => f.type === 'repeater');

    // Handle regular translatable fields
    for (const field of translatableFields) {
        let existingTranslation;

        // The actual data structure in JSON is: heroSections: [{ title: "", featureCards_0: {...} }]
        // So we need to look in the array format first
        if (Array.isArray(existingTranslations[repeaterField.name]) &&
            existingTranslations[repeaterField.name][itemIndex]) {
            existingTranslation = existingTranslations[repeaterField.name][itemIndex][field.name];
        } else if (existingTranslations[key]) {
            existingTranslation = existingTranslations[key][field.name];
        }

        itemData[field.name] = existingTranslation !== undefined ?
            existingTranslation : getFieldDefaultValue(field);
    }

    // Handle nested repeater fields recursively
    for (const nestedRepeaterField of nestedRepeaterFields) {
        // Look for nested indexed keys in the array item
        const arrayItem = Array.isArray(existingTranslations[repeaterField.name]) ?
            existingTranslations[repeaterField.name][itemIndex] :
            existingTranslations[key];

        if (arrayItem) {
            // Find all nested indexed keys for this repeater field
            Object.keys(arrayItem).forEach(nestedKey => {
                if (nestedKey.startsWith(`${nestedRepeaterField.name}_`)) {
                    const nestedTranslation = arrayItem[nestedKey];
                    itemData[nestedKey] = nestedTranslation;
                }
            });
        }
    }

    return itemData;
}/**
 * Filter schema by mode efficiently
 */
export function filterSchemaByModeOptimized(schema: SchemaItem[], mode: RenderMode): SchemaItem[] {
    const normalizedSchema = normalizeSchema(schema) as SchemaItem[];

    // First filter out hidden items for all modes
    const visibleSchema = normalizedSchema.filter(item => {
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