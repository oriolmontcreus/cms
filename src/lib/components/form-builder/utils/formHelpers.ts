import type { FormField, Layout, SchemaItem, ComponentTab, TabsContainer, FormData, TranslationData } from '../types';
import { RenderMode } from '../types';
import type { Component } from '@/lib/shared/types/pages.type';
import { SCHEMA_TYPES, DEFAULT_VALUES } from '../constants';
import { CMS_LOCALE } from '@/lib/shared/env';

export interface FormBuilderContext {
    collectFilesForDeletion: (itemData: any) => void;
    saveTranslations?: () => Promise<void>;
}

export function collectFilesForDeletion(itemData: any, addToQueue: (fileIds: string[]) => void) {
    console.log('[formHelpers] collectFilesForDeletion called');
    const fileIds: string[] = [];

    function extractFileIds(obj: any) {
        if (!obj || typeof obj !== 'object') return;

        for (const value of Object.values(obj)) {
            if (value && typeof value === 'object') {
                if ('id' in value && 'originalName' in value && typeof value.id === 'string') {
                    fileIds.push(value.id);
                }
                else if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (item && typeof item === 'object' && 'id' in item && 'originalName' in item && typeof item.id === 'string') {
                            fileIds.push(item.id);
                        } else {
                            extractFileIds(item);
                        }
                    });
                }
                else {
                    extractFileIds(value);
                }
            }
        }
    }
    extractFileIds(itemData);
    if (fileIds.length > 0) addToQueue(fileIds);
}

export function convertToFormField(item: any): FormField | null {
    if (item && typeof item === 'object' && 'toJSON' in item && typeof item.toJSON === 'function') {
        return item.toJSON();
    }
    if (item && 'name' in item && 'type' in item) {
        // Exclude structural schema items that are not form fields
        if (item.type === SCHEMA_TYPES.TABS_CONTAINER ||
            item.type === SCHEMA_TYPES.GRID ||
            item.type === SCHEMA_TYPES.TABS ||
            item.type === SCHEMA_TYPES.TABS_SELECTOR) {
            return null;
        }
        return item as FormField;
    }
    return null;
}

// Global schema analysis cache
const schemaAnalysisCache = new WeakMap();
const componentAnalysisCache = new WeakMap();

interface SchemaAnalysis {
    allFields: FormField[];
    translatableFields: FormField[];
    repeaterFields: FormField[];
}

interface ComponentAnalysis extends SchemaAnalysis {
    hasFilamentTabs: boolean;
    hasMixedSchema: boolean;
}

// Internal helper function for getting all fields from a schema
export function getAllFields(schema: Layout | SchemaItem[]): FormField[] {
    if (Array.isArray(schema)) {
        return schema
            .flatMap(item => {
                if (item && typeof item === 'object' && 'type' in item) {
                    if (item.type === SCHEMA_TYPES.GRID) {
                        return item.schema || [];
                    }
                    if (item.type === SCHEMA_TYPES.TABS_CONTAINER) {
                        return (item as TabsContainer).tabs.flatMap(tab =>
                            getAllFields(tab.schema)
                        );
                    }
                }
                return convertToFormField(item);
            })
            .filter((item): item is FormField => item !== null);
    }
    if (schema.type === SCHEMA_TYPES.GRID) return schema.schema;
    if (schema.type === SCHEMA_TYPES.TABS) return schema.tabs.flatMap(tab => tab.schema);
    return [];
}

function analyzeSchema(schema: Layout | SchemaItem[]): SchemaAnalysis {
    if (schemaAnalysisCache.has(schema)) {
        return schemaAnalysisCache.get(schema);
    }

    const allFields = getAllFields(schema);
    console.log('[formHelpers] getAllFields called');

    const result: SchemaAnalysis = {
        allFields,
        translatableFields: allFields.filter((field: FormField) => field.translatable === true),
        repeaterFields: allFields.filter((field: FormField) => {
            if (field.type === 'repeater' && field.schema) {
                const nestedAnalysis = analyzeSchema(field.schema);
                return nestedAnalysis.translatableFields.length > 0;
            }
            return false;
        })
    };

    schemaAnalysisCache.set(schema, result);
    return result;
}

function getOrCreateComponentAnalysis(component: any): ComponentAnalysis {
    if (componentAnalysisCache.has(component)) {
        return componentAnalysisCache.get(component);
    }

    const schema = component.schema;
    const schemaAnalysis = analyzeSchema(schema);

    const result: ComponentAnalysis = {
        ...schemaAnalysis,
        hasFilamentTabs: Array.isArray(schema) && schema.some((item: any) => item.type === SCHEMA_TYPES.TABS_CONTAINER),
        hasMixedSchema: Array.isArray(schema) && schema.some((item: any) => item.type === SCHEMA_TYPES.TABS_SELECTOR)
    };

    componentAnalysisCache.set(component, result);
    return result;
}

export function initializeFormData(components: any[], existingComponents: Component[]): FormData {
    console.log('[formHelpers] initializeFormData called');
    const formData: FormData = {};

    components.forEach(componentInstance => {
        const { allFields } = getOrCreateComponentAnalysis(componentInstance.component);
        formData[componentInstance.id] = {};
        const existingComponent = existingComponents.find(c => c.instanceId === componentInstance.id);

        allFields.forEach(field => {
            const existingValue = existingComponent?.formData[field.name];
            formData[componentInstance.id][field.name] = existingValue !== undefined ?
                existingValue : getDefaultValue(field);
        });
    });

    return formData;
}

export function initializeTranslationData(
    components: any[],
    existingComponents: Component[],
    locales: readonly { code: string; name: string; }[]
): TranslationData {
    console.log('[formHelpers] initializeTranslationData called');
    const translationData: TranslationData = {};

    components.forEach(componentInstance => {
        const { translatableFields, repeaterFields } = getOrCreateComponentAnalysis(componentInstance.component);
        const existingComponent = existingComponents.find(c => c.instanceId === componentInstance.id);
        translationData[componentInstance.id] = {};

        locales.forEach(locale => {
            translationData[componentInstance.id][locale.code] = {};

            // Handle regular translatable fields
            translatableFields.forEach(field => {
                if (field.type === 'repeater') return;

                const existingTranslation = existingComponent?.formData?.translations?.[locale.code]?.[field.name];
                translationData[componentInstance.id][locale.code][field.name] =
                    existingTranslation !== undefined ? existingTranslation :
                        locale.code === CMS_LOCALE ? (existingComponent?.formData?.[field.name] ?? getDefaultValue(field)) :
                            getDefaultValue(field);
            });

            // Handle repeater fields
            if (locale.code !== CMS_LOCALE) {
                repeaterFields.forEach(repeaterField => {
                    const repeaterItems = existingComponent?.formData?.[repeaterField.name] || [];
                    const { translatableFields: nestedTranslatableFields } = analyzeSchema(repeaterField.schema || []);

                    repeaterItems.forEach((item: any, itemIndex: number) => {
                        const key = `${repeaterField.name}_${itemIndex}`;
                        translationData[componentInstance.id][locale.code][key] = {};


                        nestedTranslatableFields.forEach(nestedField => {
                            // Try to get existing translation from array format first, then fall back to indexed format
                            let existingTranslation;
                            const existingTranslations = existingComponent?.formData?.translations?.[locale.code];

                            if (existingTranslations) {
                                // Try array format first (new format)
                                if (Array.isArray(existingTranslations[repeaterField.name]) &&
                                    existingTranslations[repeaterField.name][itemIndex]) {
                                    existingTranslation = existingTranslations[repeaterField.name][itemIndex][nestedField.name];
                                }
                                // Fall back to indexed format (old format) 
                                else if (existingTranslations[key]) {
                                    existingTranslation = existingTranslations[key][nestedField.name];
                                }
                            }

                            translationData[componentInstance.id][locale.code][key][nestedField.name] =
                                existingTranslation !== undefined ? existingTranslation : getDefaultValue(nestedField);
                        });
                    });
                });
            }
        });
    });

    return translationData;
}

// Export these functions but make them use the cached analysis
export function getTranslatableFields(schema: Layout | SchemaItem[]): FormField[] {
    return analyzeSchema(schema).translatableFields;
}

export function getRepeaterFieldsWithTranslatableContent(schema: Layout | SchemaItem[]): FormField[] {
    return analyzeSchema(schema).repeaterFields;
}

export function usesMixedSchema(component: any): boolean {
    return getOrCreateComponentAnalysis(component).hasMixedSchema;
}

export function usesFilamentTabs(component: any): boolean {
    return getOrCreateComponentAnalysis(component).hasFilamentTabs;
}

export function isFormField(item: SchemaItem): item is FormField {
    return convertToFormField(item) !== null;
}

export function isTabsContainer(item: SchemaItem): item is TabsContainer {
    return item && typeof item === 'object' && 'type' in item && item.type === SCHEMA_TYPES.TABS_CONTAINER;
}

export function groupFieldsByTab(fields: FormField[], tabs: ComponentTab[], schema: any[]): Record<string, FormField[]> {
    console.log('[formHelpers] groupFieldsByTab called');
    const tabFields: Record<string, FormField[]> = {};

    tabs.forEach(tab => {
        tabFields[tab.name] = [];
    });

    // Get field names that are inside grids to exclude them
    const fieldsInGrids = new Set<string>();
    if (Array.isArray(schema)) {
        schema.forEach(item => {
            if (item && typeof item === 'object' && 'type' in item && item.type === SCHEMA_TYPES.GRID && item.schema) {
                item.schema.forEach((field: any) => {
                    if (field && field.name) {
                        fieldsInGrids.add(field.name);
                    }
                });
            }
        });
    }

    fields.forEach(field => {
        // Only add fields that are NOT in grids (grids will handle their own fields)
        if (field.tab && tabFields[field.tab] && !fieldsInGrids.has(field.name)) {
            tabFields[field.tab].push(field);
        }
    });

    return tabFields;
}

export function gridHasNonTabbedFields(grid: any): boolean {
    if (!grid || grid.type !== SCHEMA_TYPES.GRID || !grid.schema) return false;
    return grid.schema.some((field: any) => !field.tab);
}

export function renderSchemaItem(item: SchemaItem, componentId: string, activeTab?: string) {
    if (isFormField(item)) {
        const field = convertToFormField(item);
        if (field) {
            return {
                type: 'field' as const,
                field,
                componentId
            };
        }
    } else if (item && typeof item === 'object' && 'type' in item) {
        if (item.type === SCHEMA_TYPES.GRID) {
            return {
                type: 'grid' as const,
                layout: item,
                componentId,
                activeTab
            };
        }
    }
    return null;
}

// Cache for flattened fields
const flattenedFieldsCache = new WeakMap();

export function getFlattenedFields(schema: Layout | SchemaItem[]): {
    allFields: FormField[],
    translatableFields: FormField[],
    repeaterFields: FormField[]
} {
    console.log('[formHelpers] getFlattenedFields called');

    if (flattenedFieldsCache.has(schema)) {
        console.log('[formHelpers] getFlattenedFields cache hit');
        return flattenedFieldsCache.get(schema);
    }

    const allFields = getAllFields(schema);
    const result = {
        allFields,
        translatableFields: allFields.filter(field => field.translatable === true),
        repeaterFields: allFields.filter(field => {
            if (field.type === 'repeater' && field.schema) {
                const nestedFields = getAllFields(field.schema);
                return nestedFields.some(f => f.translatable === true);
            }
            return false;
        })
    };

    flattenedFieldsCache.set(schema, result);
    return result;
}

function getDefaultValue(field: FormField) {
    const defaultValueMap = new Map<string, any>([
        ['number', DEFAULT_VALUES.NULL],
        ['toggle', DEFAULT_VALUES.FALSE],
        ['dateRange', DEFAULT_VALUES.DATE_RANGE],
        ['color', DEFAULT_VALUES.COLOR],
        ['richtext', DEFAULT_VALUES.EMPTY_STRING]
    ]);

    // Handle SELECT field with special logic
    if (field.type === 'select') {
        return field.multiple ? DEFAULT_VALUES.EMPTY_ARRAY : DEFAULT_VALUES.EMPTY_STRING;
    }

    return defaultValueMap.get(field.type) ?? DEFAULT_VALUES.EMPTY_STRING;
}

/**
 * Filters schema items based on render mode
 * In translation mode, only shows fields marked as translatable
 * In content mode, shows all fields
 */
export function filterSchemaByMode(schema: SchemaItem[], mode: RenderMode): SchemaItem[] {
    // First filter out hidden items for all modes
    const visibleSchema = schema.filter(item => {
        const field = convertToFormField(item);
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

    // Translation mode - filter to only translatable fields
    return visibleSchema.filter(item => {
        // First check for non-field items like grids, tabs, etc.
        if (item && typeof item === 'object' && 'type' in item) {
            if (item.type === SCHEMA_TYPES.GRID && 'schema' in item) {
                const hasTranslatableFields = (item.schema as FormField[]).some(f => {
                    if (f.hidden) return false; // Skip hidden fields
                    if (f.translatable === true) return true;
                    // Check if it's a repeater field with translatable nested content
                    if (f.type === 'repeater' && f.schema) {
                        const nestedFields = getAllFields(f.schema);
                        return nestedFields.some(nf => nf.translatable === true);
                    }
                    return false;
                });
                return hasTranslatableFields;
            }
            if (item.type === SCHEMA_TYPES.TABS_CONTAINER && 'tabs' in item) {
                const hasTranslatableFields = (item as TabsContainer).tabs.some(tab => {
                    if (tab.hidden) return false; // Skip hidden tabs
                    const tabFiltered = filterSchemaByMode(tab.schema, mode);
                    return tabFiltered.length > 0;
                });
                return hasTranslatableFields;
            }
        }

        // Then check if it's a form field
        const field = convertToFormField(item);
        if (field) {
            // Check if it's a regular translatable field
            if (field.translatable === true) {
                return true;
            }

            // Check if it's a repeater field with translatable nested content
            if (field.type === 'repeater' && field.schema) {
                const nestedFields = getAllFields(field.schema);
                const hasTranslatableNestedFields = nestedFields.some(f => f.translatable === true);
                return hasTranslatableNestedFields;
            }

            return false;
        }

        return false;
    });
}

/**
 * Filters fields within a grid or container based on render mode
 */
export function filterFieldsByMode(fields: FormField[], mode: RenderMode): FormField[] {
    //First filter out hidden fields regardless of mode
    const visibleFields = fields.filter(field => !field.hidden);

    if (mode === RenderMode.CONTENT) {
        return visibleFields;
    }

    // Translation mode - only translatable fields
    return visibleFields.filter(field => field.translatable === true);
}

/**
 * Converts translation data with indexed keys back to proper array structure for saving
 */
export function convertTranslationDataForSaving(
    translationData: TranslationData,
    componentInstance: any
): TranslationData {

    // Early return if no translation data
    if (!translationData || Object.keys(translationData).length === 0) {
        return {};
    }

    const convertedData: TranslationData = {};
    const { repeaterFields } = getOrCreateComponentAnalysis(componentInstance.component);

    Object.entries(translationData).forEach(([componentId, locales]) => {
        // Skip if no locales for this component
        if (!locales || Object.keys(locales).length === 0) return;

        convertedData[componentId] = {};

        Object.entries(locales).forEach(([locale, translations]) => {
            // Skip if no translations for this locale
            if (!translations || Object.keys(translations).length === 0) {
                return;
            }
            convertedData[componentId][locale] = {};

            // Separate regular fields from repeater field indexed keys
            const regularTranslations: Record<string, any> = {};
            const repeaterTranslations: Record<string, Record<number, any>> = {};

            Object.entries(translations).forEach(([key, value]) => {
                // Check if this is an indexed repeater field key (e.g., "featureCards_0")
                const repeaterField = repeaterFields.find((rf: FormField) => key.startsWith(`${rf.name}_`));

                if (repeaterField) {
                    const index = parseInt(key.split('_').pop() || '0');

                    if (!repeaterTranslations[repeaterField.name]) {
                        repeaterTranslations[repeaterField.name] = {};
                    }

                    repeaterTranslations[repeaterField.name][index] = value;
                } else {
                    // Regular field translation
                    regularTranslations[key] = value;
                }
            });

            // Add regular translations
            Object.assign(convertedData[componentId][locale], regularTranslations);

            // Convert indexed repeater translations to arrays
            Object.entries(repeaterTranslations).forEach(([fieldName, indexedItems]) => {
                const maxIndex = Math.max(...Object.keys(indexedItems as Record<number, any>).map(Number));
                const translationArray: any[] = [];

                for (let i = 0; i <= maxIndex; i++) {
                    translationArray[i] = (indexedItems as Record<number, any>)[i] || {};
                }

                convertedData[componentId][locale][fieldName] = translationArray;
            });
        });
    });

    return convertedData;
}