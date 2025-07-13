import type { FormField, Layout, SchemaItem, ComponentTab, TabsContainer, FormData, TranslationData } from '../types';
import type { Component } from '@shared/types/pages.type';
import { SCHEMA_TYPES, DEFAULT_VALUES } from '../constants';
import { CMS_LOCALE } from '@shared/env';

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

export function getAllFields(schema: Layout | SchemaItem[]): FormField[] {
    console.log('[formHelpers] getAllFields called');
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

export function usesMixedSchema(component: any): boolean {
    console.log('[formHelpers] usesMixedSchema called');
    if (!Array.isArray(component.schema)) return false;
    return component.schema.some((item: any) => item.type === SCHEMA_TYPES.TABS_SELECTOR);
}

export function usesFilamentTabs(component: any): boolean {
    console.log('[formHelpers] usesFilamentTabs called');
    if (!Array.isArray(component.schema)) return false;
    return component.schema.some((item: any) => item.type === SCHEMA_TYPES.TABS_CONTAINER);
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

export function initializeFormData(components: any[], existingComponents: Component[]): FormData {
    console.log('[formHelpers] initializeFormData called');
    const formData: FormData = {};
    
    components.forEach(componentInstance => {
        formData[componentInstance.id] = {};
        const existingComponent = existingComponents.find(c => c.instanceId === componentInstance.id);
        
        const allFields = getAllFields(componentInstance.component.schema);
        
        allFields.forEach(field => {
            const existingValue = existingComponent?.formData[field.name];
            if (existingValue !== undefined) {
                formData[componentInstance.id][field.name] = existingValue;
            } else {
                formData[componentInstance.id][field.name] = getDefaultValue(field);
            }
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
        translationData[componentInstance.id] = {};
        const existingComponent = existingComponents.find(c => c.instanceId === componentInstance.id);
        
        locales.forEach(locale => {
            translationData[componentInstance.id][locale.code] = {};
            
            const allFields = getAllFields(componentInstance.component.schema);
            const translatableFields = allFields.filter(field => field.translatable);
            
            translatableFields.forEach(field => {
                if (field.type === 'repeatable') return;
                
                const existingTranslation = existingComponent?.formData?.translations?.[locale.code]?.[field.name];
                
                if (existingTranslation !== undefined) {
                    // Use existing translation if available
                    translationData[componentInstance.id][locale.code][field.name] = existingTranslation;
                } else if (locale.code === CMS_LOCALE) {
                    // For default locale, use the current content mode value
                    const contentModeValue = existingComponent?.formData?.[field.name];
                    translationData[componentInstance.id][locale.code][field.name] = contentModeValue !== undefined ? contentModeValue : getDefaultValue(field);
                } else {
                    // For other locales, use default value
                    translationData[componentInstance.id][locale.code][field.name] = getDefaultValue(field);
                }
            });
            
            // Handle repeatable fields separately
            const repeatableFields = getAllFields(componentInstance.component.schema).filter(field => field.type === 'repeatable');
            repeatableFields.forEach(repeatableField => {
                const repeatableItems = existingComponent?.formData?.[repeatableField.name] || [];
                const translatableNestedFields = getAllFields(repeatableField.schema || []).filter(f => f.translatable);
                
                repeatableItems.forEach((item: any, itemIndex: number) => {
                    const key = `${repeatableField.name}_${itemIndex}`;
                    
                    translatableNestedFields.forEach(nestedField => {
                        if (locale.code === CMS_LOCALE) {
                            // For default locale, we don't store in translation data, it's in content mode
                            return;
                        }
                        
                        // Check if translation exists in the saved format (array structure)
                        const existingTranslation = existingComponent?.formData?.translations?.[locale.code]?.[repeatableField.name]?.[itemIndex]?.[nestedField.name];
                        
                        if (!translationData[componentInstance.id][locale.code][key]) {
                            translationData[componentInstance.id][locale.code][key] = {};
                        }
                        
                        if (existingTranslation !== undefined) {
                            translationData[componentInstance.id][locale.code][key][nestedField.name] = existingTranslation;
                        } else {
                            translationData[componentInstance.id][locale.code][key][nestedField.name] = getDefaultValue(nestedField);
                        }
                    });
                });
            });
        });
    });
    
    return translationData;
}

export function getTranslatableFields(schema: Layout | SchemaItem[]): FormField[] {
    console.log('[formHelpers] getTranslatableFields called');
    const allFields = getAllFields(schema);
    return allFields.filter(field => field.translatable === true);
}

export function getRepeatableFieldsWithTranslatableContent(schema: Layout | SchemaItem[]): FormField[] {
    console.log('[formHelpers] getRepeatableFieldsWithTranslatableContent called');
    const allFields = getAllFields(schema);
    return allFields.filter(field => {
        if (field.type === 'repeatable' && field.schema) {
            const nestedTranslatableFields = getAllFields(field.schema).filter(f => f.translatable === true);
            return nestedTranslatableFields.length > 0;
        }
        return false;
    });
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

 