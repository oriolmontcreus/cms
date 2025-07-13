<script lang="ts">
    import type { PageConfig, FormData, TranslationData } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import { handleDeleteFiles, handleUploadFiles } from '@/services/file.service';
    import type { Component } from '@shared/types/pages.type';
    import type { UploadedFileWithDeletionFlag } from '@shared/types/file.type';
    import ComponentRenderer from './components/ComponentRenderer.svelte';
    import { initializeFormData, initializeTranslationData, getAllFields, collectFilesForDeletion, getTranslatableFields, getRepeatableFieldsWithTranslatableContent, type FormBuilderContext } from './utils/formHelpers';
    import { CSS_CLASSES } from './constants';
    import { writable } from 'svelte/store';
    import { setContext } from 'svelte';
    import { SITE_LOCALES, CMS_LOCALE } from '@shared/env';

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];
    export let translationMode: boolean = false;

    let formData: FormData = initializeFormData(config.components, components);
    let translationData: TranslationData = initializeTranslationData(config.components, components, SITE_LOCALES);
    export let isSubmitting = false;

    // Add execution counter
    let reactiveExecutionCount = 0;

    // Ensure translation data is properly initialized for repeatable fields
    $: {
        console.log('[FormBuilder] Reactive block #1 executed', ++reactiveExecutionCount);
        config.components.forEach(componentInstance => {
            const repeatableFields = getRepeatableFieldsWithTranslatableContent(componentInstance.component.schema);
            
            repeatableFields.forEach(repeatableField => {
                const repeatableItems = formData[componentInstance.id]?.[repeatableField.name] || [];
                const translatableNestedFields = getAllFields(repeatableField.schema || []).filter(f => f.translatable);
                
                SITE_LOCALES.forEach(locale => {
                    if (locale.code !== CMS_LOCALE) {
                        repeatableItems.forEach((item: any, itemIndex: number) => {
                            const key = `${repeatableField.name}_${itemIndex}`;
                            
                            if (!translationData[componentInstance.id]) {
                                translationData[componentInstance.id] = {};
                            }
                            if (!translationData[componentInstance.id][locale.code]) {
                                translationData[componentInstance.id][locale.code] = {};
                            }
                            if (!translationData[componentInstance.id][locale.code][key]) {
                                translationData[componentInstance.id][locale.code][key] = {};
                            }
                            
                            translatableNestedFields.forEach(nestedField => {
                                if (translationData[componentInstance.id][locale.code][key][nestedField.name] === undefined) {
                                    translationData[componentInstance.id][locale.code][key][nestedField.name] = '';
                                }
                            });
                        });
                    }
                });
            });
        });
    }
    $: {
        console.log('[FormBuilder] Reactive block #2 executed', ++reactiveExecutionCount);
        if (!translationMode) {
            // Only sync when in content mode to avoid conflicts
            config.components.forEach(componentInstance => {
                const translatableFields = getTranslatableFields(componentInstance.component.schema);
                
                translatableFields.forEach(field => {
                    const contentModeValue = formData[componentInstance.id]?.[field.name];
                    const currentTranslationValue = translationData[componentInstance.id]?.[CMS_LOCALE]?.[field.name];
                    
                    // Only sync if values are different to avoid unnecessary updates
                    if (contentModeValue !== undefined && 
                        translationData[componentInstance.id]?.[CMS_LOCALE] &&
                        contentModeValue !== currentTranslationValue) {
                        translationData[componentInstance.id][CMS_LOCALE][field.name] = contentModeValue;
                    }
                });
            });
        }
    }

    const filesToDelete = writable<string[]>([]);

    const formBuilderContext: FormBuilderContext = {
        collectFilesForDeletion: (itemData: any) => {
            collectFilesForDeletion(itemData, (fileIds: string[]) => {
                filesToDelete.update(current => [...current, ...fileIds]);
            });
        }
    };
    setContext('formBuilder', formBuilderContext);

    async function uploadPendingFiles(data: any, fieldConfig?: any): Promise<any> {
        console.log('[FormBuilder] uploadPendingFiles called');
        if (!data || typeof data !== 'object') return data;
        
        if (data instanceof File) {
            const uploadedFiles = await handleUploadFiles([data]);
            return uploadedFiles?.[0] || null;
        }
        
        if (Array.isArray(data)) {
            const result = [];
            for (const item of data) {
                if (item && (item as UploadedFileWithDeletionFlag)._markedForDeletion) {
                    if ((item as UploadedFileWithDeletionFlag).id) {
                        filesToDelete.update(current => [...current, (item as UploadedFileWithDeletionFlag).id]);
                    }
                } else if (item instanceof File) {
                    const uploadedFiles = await handleUploadFiles([item]);
                    if (uploadedFiles?.[0]) result.push(uploadedFiles[0]);
                } else {
                    result.push(await uploadPendingFiles(item));
                }
            }
            return result.length > 0 ? result : null;
        }
        
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
            if (value instanceof File) {
                const existingValue = formData[fieldConfig?.componentId]?.[key];
                if (existingValue && existingValue.id && !Array.isArray(existingValue)) {
                    await handleDeleteFiles([existingValue.id]);
                }
            } else if (value && (value as UploadedFileWithDeletionFlag)._markedForDeletion) {
                if ((value as UploadedFileWithDeletionFlag).id) {
                    filesToDelete.update(current => [...current, (value as UploadedFileWithDeletionFlag).id]);
                }
                result[key] = null;
                continue;
            }
            result[key] = await uploadPendingFiles(value);
        }
        return result;
    }

    export async function handleSubmit() {
        console.log('[FormBuilder] handleSubmit called');
        try {
            isSubmitting = true;
            
            const processedFormData = { ...formData };
            for (const componentId of Object.keys(processedFormData)) {
                processedFormData[componentId] = await uploadPendingFiles(
                    processedFormData[componentId], 
                    { componentId }
                );
            }
            
            const updatedComponents: Component[] = await Promise.all(config.components.map(async componentInstance => {
                const allFields = getAllFields(componentInstance.component.schema);
                const colorFields = allFields.filter(field => field.type === 'color');
                
                let componentFormData = { ...processedFormData[componentInstance.id] };
                
                // For translatable fields, sync between content mode and translation mode
                const translatableFields = getAllFields(componentInstance.component.schema).filter(field => field.translatable);
                translatableFields.forEach(field => {
                    // If we have a content mode value, it should be the source of truth for default locale
                    const contentModeValue = componentFormData[field.name];
                    if (contentModeValue !== undefined && translationData[componentInstance.id]?.[CMS_LOCALE]) {
                        // Update translation data with content mode value
                        translationData[componentInstance.id][CMS_LOCALE][field.name] = contentModeValue;
                    }
                });
                
                for (const field of colorFields) {
                    const value = componentFormData[field.name];
                    if (value && typeof value !== 'string') {
                        console.warn(`Color field ${field.name} contains non-string value:`, value, 'Resetting to empty string');
                        componentFormData[field.name] = '';
                    }
                }
                
                // Process translation data
                const processedTranslationData: any = {};
                if (translationData[componentInstance.id]) {
                    for (const [locale, localeData] of Object.entries(translationData[componentInstance.id])) {
                        processedTranslationData[locale] = {};
                        
                        // Handle regular translatable fields
                        const regularFields = getTranslatableFields(componentInstance.component.schema);
                        for (const field of regularFields) {
                            if (localeData[field.name] !== undefined) {
                                processedTranslationData[locale][field.name] = await uploadPendingFiles(localeData[field.name]);
                            }
                        }
                        
                        // Handle repeatable field translations
                        const repeatableFields = getRepeatableFieldsWithTranslatableContent(componentInstance.component.schema);
                        for (const repeatableField of repeatableFields) {
                            const repeatableItems = formData[componentInstance.id]?.[repeatableField.name] || [];
                            const translatableNestedFields = getAllFields(repeatableField.schema || []).filter(f => f.translatable);
                            
                            for (let itemIndex = 0; itemIndex < repeatableItems.length; itemIndex++) {
                                const key = `${repeatableField.name}_${itemIndex}`;
                                if (localeData[key]) {
                                    if (!processedTranslationData[locale][repeatableField.name]) {
                                        processedTranslationData[locale][repeatableField.name] = [];
                                    }
                                    if (!processedTranslationData[locale][repeatableField.name][itemIndex]) {
                                        processedTranslationData[locale][repeatableField.name][itemIndex] = {};
                                    }
                                    
                                    for (const nestedField of translatableNestedFields) {
                                        if (localeData[key][nestedField.name] !== undefined) {
                                            processedTranslationData[locale][repeatableField.name][itemIndex][nestedField.name] = 
                                                await uploadPendingFiles(localeData[key][nestedField.name]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                return {
                    componentName: componentInstance.component.name,
                    instanceId: componentInstance.id,
                    displayName: componentInstance.displayName || componentInstance.component.name,
                    formData: {
                        ...componentFormData,
                        translations: processedTranslationData
                    }
                };
            }));
            
            await handleUpdateComponents(slug, updatedComponents);
            
            const fileIdsToDelete = $filesToDelete;
            
            if (fileIdsToDelete.length > 0) {
                await handleDeleteFiles(fileIdsToDelete);
                filesToDelete.set([]);
            }
            
        } catch (error) {
            console.error('Error saving components:', error);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class={CSS_CLASSES.FORM_CONTAINER}>
    {#each config.components as componentInstance (componentInstance.id)}
        <ComponentRenderer 
            {componentInstance} 
            {formData}
            {translationMode}
            {translationData}
            locales={SITE_LOCALES}
        />
    {/each}
</div> 