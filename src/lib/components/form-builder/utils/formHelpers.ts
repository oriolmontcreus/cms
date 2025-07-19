import type { FormField, Layout, SchemaItem, ComponentTab, TabsContainer, FormData, TranslationData } from '../types';
import { RenderMode } from '../types';
import type { Component } from '@/lib/shared/types/pages.type';
import { SCHEMA_TYPES, DEFAULT_VALUES } from '../constants';
import { CMS_LOCALE } from '@/lib/shared/env';

export interface FormBuilderContext {
    collectFilesForDeletion: (itemData: any) => void;
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
    repeatableFields: FormField[];
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
        repeatableFields: allFields.filter((field: FormField) => {
            if (field.type === 'repeatable' && field.schema) {
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
        const { translatableFields, repeatableFields } = getOrCreateComponentAnalysis(componentInstance.component);
        const existingComponent = existingComponents.find(c => c.instanceId === componentInstance.id);
        translationData[componentInstance.id] = {};
        
        locales.forEach(locale => {
            translationData[componentInstance.id][locale.code] = {};
            
            // Handle regular translatable fields
            translatableFields.forEach(field => {
                if (field.type === 'repeatable') return;
                
                const existingTranslation = existingComponent?.formData?.translations?.[locale.code]?.[field.name];
                translationData[componentInstance.id][locale.code][field.name] = 
                    existingTranslation !== undefined ? existingTranslation :
                    locale.code === CMS_LOCALE ? (existingComponent?.formData?.[field.name] ?? getDefaultValue(field)) :
                    getDefaultValue(field);
            });
            
            // Handle repeatable fields
            if (locale.code !== CMS_LOCALE) {
                repeatableFields.forEach(repeatableField => {
                    const repeatableItems = existingComponent?.formData?.[repeatableField.name] || [];
                    const { translatableFields: nestedTranslatableFields } = analyzeSchema(repeatableField.schema || []);
                    
                    repeatableItems.forEach((item: any, itemIndex: number) => {
                        const key = `${repeatableField.name}_${itemIndex}`;
                        translationData[componentInstance.id][locale.code][key] = {};
                        
                        nestedTranslatableFields.forEach(nestedField => {
                            const existingTranslation = existingComponent?.formData?.translations?.[locale.code]?.[repeatableField.name]?.[itemIndex]?.[nestedField.name];
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

export function getRepeatableFieldsWithTranslatableContent(schema: Layout | SchemaItem[]): FormField[] {
    return analyzeSchema(schema).repeatableFields;
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
    repeatableFields: FormField[]
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
        repeatableFields: allFields.filter(field => {
            if (field.type === 'repeatable' && field.schema) {
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
    if (mode === RenderMode.CONTENT) {
        return schema;
    }
    
    // Translation mode - filter to only translatable fields
    return schema.filter(item => {
        const field = convertToFormField(item);
        if (field) {
            return field.translatable === true;
        }
        
        // For non-field items like grids, tabs, etc., check if they contain translatable fields
        if (item && typeof item === 'object' && 'type' in item) {
            if (item.type === SCHEMA_TYPES.GRID && 'schema' in item) {
                const hasTranslatableFields = (item.schema as FormField[]).some(f => f.translatable === true);
                return hasTranslatableFields;
            }
            if (item.type === SCHEMA_TYPES.TABS_CONTAINER && 'tabs' in item) {
                const hasTranslatableFields = (item as TabsContainer).tabs.some(tab => 
                    filterSchemaByMode(tab.schema, mode).length > 0
                );
                return hasTranslatableFields;
            }
        }
        
        return false;
    });
}

/**
 * Filters fields within a grid or container based on render mode
 */
export function filterFieldsByMode(fields: FormField[], mode: RenderMode): FormField[] {
    if (mode === RenderMode.CONTENT) {
        return fields;
    }
    
    // Translation mode - only translatable fields
    return fields.filter(field => field.translatable === true);
} 

 