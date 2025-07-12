import type { FormField, Layout, SchemaItem, ComponentTab, TabsContainer, FormData } from '../types';
import type { Component } from '@shared/types/pages.type';
import { SCHEMA_TYPES, FIELD_TYPES, DEFAULT_VALUES } from '../constants';

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

// New function to recursively find all file fields including those in RepeatableField
export function getAllFileFields(schema: Layout | SchemaItem[]): FormField[] {
    const allFields: FormField[] = [];
    
    const processSchema = (items: SchemaItem[] | Layout) => {
        const schemaItems = Array.isArray(items) ? items : [items];
        
        for (const item of schemaItems) {
            if (item && typeof item === 'object' && 'type' in item) {
                if (item.type === SCHEMA_TYPES.GRID) {
                    processSchema(item.schema || []);
                } else if (item.type === SCHEMA_TYPES.TABS_CONTAINER) {
                    const tabsContainer = item as TabsContainer;
                    tabsContainer.tabs.forEach(tab => processSchema(tab.schema));
                } else {
                    const field = convertToFormField(item);
                    if (field) {
                        if (field.type === 'file') {
                            allFields.push(field);
                        } else if (field.type === 'repeatable' && field.schema) {
                            // Recursively process RepeatableField schema
                            const nestedFileFields = getAllFileFields(field.schema);
                            allFields.push(...nestedFileFields);
                        }
                    }
                }
            } else {
                const field = convertToFormField(item);
                if (field) {
                    if (field.type === 'file') {
                        allFields.push(field);
                    } else if (field.type === 'repeatable' && field.schema) {
                        // Recursively process RepeatableField schema
                        const nestedFileFields = getAllFileFields(field.schema);
                        allFields.push(...nestedFileFields);
                    }
                }
            }
        }
    };
    
    processSchema(schema);
    return allFields;
}


export function usesMixedSchema(component: any): boolean {
    if (!Array.isArray(component.schema)) return false;
    return component.schema.some((item: any) => item.type === SCHEMA_TYPES.TABS_SELECTOR);
}

export function usesFilamentTabs(component: any): boolean {
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

// New function to recursively process file uploads for nested fields
export async function processFileUploads(
    schema: Layout | SchemaItem[],
    componentId: string,
    formData: Record<string, any>,
    fileUploadState: Record<string, { pendingFiles: File[]; filesToDelete: string[] }>,
    uploadFiles: (files: File[]) => Promise<any[] | null>,
    deleteFiles: (fileIds: string[]) => Promise<boolean>
): Promise<Record<string, any>> {
    const processedFormData = { ...formData };
    
    const processSchemaRecursively = async (
        items: SchemaItem[] | Layout,
        currentFormData: Record<string, any>,
        fieldIdPrefix: string
    ): Promise<Record<string, any>> => {
        const schemaItems = Array.isArray(items) ? items : [items];
        const updatedFormData = { ...currentFormData };
        
        for (const item of schemaItems) {
            if (item && typeof item === 'object' && 'type' in item) {
                if (item.type === SCHEMA_TYPES.GRID) {
                    await processSchemaRecursively(item.schema || [], updatedFormData, fieldIdPrefix);
                } else if (item.type === SCHEMA_TYPES.TABS_CONTAINER) {
                    const tabsContainer = item as TabsContainer;
                    for (const tab of tabsContainer.tabs) {
                        await processSchemaRecursively(tab.schema, updatedFormData, fieldIdPrefix);
                    }
                } else {
                    const field = convertToFormField(item);
                    if (field) {
                        if (field.type === 'file') {
                            const fieldId = `${fieldIdPrefix}-${field.name}`;
                            const fileState = fileUploadState[fieldId];
                            
                            if (fileState) {
                                const { pendingFiles, filesToDelete } = fileState;
                                const currentValue = updatedFormData[field.name];
                                
                                // Delete files marked for deletion
                                if (filesToDelete.length > 0) {
                                    await deleteFiles(filesToDelete);
                                }
                                
                                // Upload new files
                                let uploadedFiles: any[] = [];
                                if (pendingFiles.length > 0) {
                                    const newUploadedFiles = await uploadFiles(pendingFiles);
                                    if (newUploadedFiles) {
                                        uploadedFiles = newUploadedFiles;
                                    }
                                }
                                
                                // Combine existing files (not deleted) with newly uploaded files
                                const existingFiles = Array.isArray(currentValue) 
                                    ? currentValue.filter((file: any) => file.id && !filesToDelete.includes(file.id))
                                    : (currentValue && currentValue.id && !filesToDelete.includes(currentValue.id) ? [currentValue] : []);
                                
                                const allFiles = [...existingFiles, ...uploadedFiles];
                                
                                // Update form data
                                if (field.multiple) {
                                    updatedFormData[field.name] = allFiles.length > 0 ? allFiles : null;
                                } else {
                                    updatedFormData[field.name] = allFiles.length > 0 ? allFiles[0] : null;
                                }
                            }
                        } else if (field.type === 'repeatable' && field.schema) {
                            // Process RepeatableField items
                            const repeatableValue = updatedFormData[field.name];
                            if (Array.isArray(repeatableValue)) {
                                for (let i = 0; i < repeatableValue.length; i++) {
                                    const itemFieldIdPrefix = `${fieldIdPrefix}-${field.name}-${i}`;
                                    repeatableValue[i] = await processSchemaRecursively(
                                        field.schema,
                                        repeatableValue[i] || {},
                                        itemFieldIdPrefix
                                    );
                                }
                            }
                        }
                    }
                }
            } else {
                const field = convertToFormField(item);
                if (field) {
                    if (field.type === 'file') {
                        const fieldId = `${fieldIdPrefix}-${field.name}`;
                        const fileState = fileUploadState[fieldId];
                        
                        if (fileState) {
                            const { pendingFiles, filesToDelete } = fileState;
                            const currentValue = updatedFormData[field.name];
                            
                            // Delete files marked for deletion
                            if (filesToDelete.length > 0) {
                                await deleteFiles(filesToDelete);
                            }
                            
                            // Upload new files
                            let uploadedFiles: any[] = [];
                            if (pendingFiles.length > 0) {
                                const newUploadedFiles = await uploadFiles(pendingFiles);
                                if (newUploadedFiles) {
                                    uploadedFiles = newUploadedFiles;
                                }
                            }
                            
                            // Combine existing files (not deleted) with newly uploaded files
                            const existingFiles = Array.isArray(currentValue) 
                                ? currentValue.filter((file: any) => file.id && !filesToDelete.includes(file.id))
                                : (currentValue && currentValue.id && !filesToDelete.includes(currentValue.id) ? [currentValue] : []);
                            
                            const allFiles = [...existingFiles, ...uploadedFiles];
                            
                            // Update form data
                            if (field.multiple) {
                                updatedFormData[field.name] = allFiles.length > 0 ? allFiles : null;
                            } else {
                                updatedFormData[field.name] = allFiles.length > 0 ? allFiles[0] : null;
                            }
                        }
                    } else if (field.type === 'repeatable' && field.schema) {
                        // Process RepeatableField items
                        const repeatableValue = updatedFormData[field.name];
                        if (Array.isArray(repeatableValue)) {
                            for (let i = 0; i < repeatableValue.length; i++) {
                                const itemFieldIdPrefix = `${fieldIdPrefix}-${field.name}-${i}`;
                                repeatableValue[i] = await processSchemaRecursively(
                                    field.schema,
                                    repeatableValue[i] || {},
                                    itemFieldIdPrefix
                                );
                            }
                        }
                    }
                }
            }
        }
        
        return updatedFormData;
    };
    
    return await processSchemaRecursively(schema, processedFormData, componentId);
} 