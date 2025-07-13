<script lang="ts">
    import type { PageConfig, FormData, TranslationData } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import { handleDeleteFiles, handleUploadFiles } from '@/services/file.service';
    import type { Component } from '@shared/types/pages.type';
    import type { UploadedFileWithDeletionFlag } from '@shared/types/file.type';
    import ComponentRenderer from './components/ComponentRenderer.svelte';
    import { initializeFormData, initializeTranslationData, collectFilesForDeletion } from './utils/formHelpers';
    import { CSS_CLASSES } from './constants';
    import { writable } from 'svelte/store';
    import { setContext } from 'svelte';
    import { SITE_LOCALES, CMS_LOCALE } from '@shared/env';

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];
    export let translationMode: boolean = false;
    export let isSubmitting = false;

    // Initialize data once on component creation
    let formData: FormData = initializeFormData(config.components, components);
    let translationData: TranslationData = initializeTranslationData(config.components, components, SITE_LOCALES);

    const filesToDelete = writable<string[]>([]);

    const formBuilderContext: FormBuilderContext = {
        collectFilesForDeletion: (itemData: any) => {
            collectFilesForDeletion(itemData, (fileIds: string[]) => {
                filesToDelete.update(current => [...current, ...fileIds]);
            });
        }
    };
    setContext('formBuilder', formBuilderContext);

    // Single reactive statement to handle all form data updates
    $: if (config.components && formData && !translationMode) {
        console.log('[FormBuilder] Form data sync executed');
        config.components.forEach(componentInstance => {
            // Handle repeatable fields translations
            const repeatableItems = formData[componentInstance.id] || {};
            Object.entries(repeatableItems).forEach(([fieldName, items]) => {
                if (Array.isArray(items)) {
                    items.forEach((item: any, itemIndex: number) => {
                        const key = `${fieldName}_${itemIndex}`;
                        
                        // Initialize translation data structure if needed
                        SITE_LOCALES.forEach(locale => {
                            if (locale.code !== CMS_LOCALE) {
                                if (!translationData[componentInstance.id]) {
                                    translationData[componentInstance.id] = {};
                                }
                                if (!translationData[componentInstance.id][locale.code]) {
                                    translationData[componentInstance.id][locale.code] = {};
                                }
                                if (!translationData[componentInstance.id][locale.code][key]) {
                                    translationData[componentInstance.id][locale.code][key] = {};
                                }
                            }
                        });
                    });
                }
            });

            // Sync content mode values to default locale translations
            Object.entries(formData[componentInstance.id] || {}).forEach(([fieldName, value]) => {
                if (translationData[componentInstance.id]?.[CMS_LOCALE]?.[fieldName] !== value) {
                    if (!translationData[componentInstance.id]) {
                        translationData[componentInstance.id] = {};
                    }
                    if (!translationData[componentInstance.id][CMS_LOCALE]) {
                        translationData[componentInstance.id][CMS_LOCALE] = {};
                    }
                    translationData[componentInstance.id][CMS_LOCALE][fieldName] = value;
                }
            });
        });
    }

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
            
            const updatedComponents = await Promise.all(config.components.map(async componentInstance => ({
                componentName: componentInstance.component.name,
                instanceId: componentInstance.id,
                displayName: componentInstance.displayName || componentInstance.component.name,
                formData: {
                    ...processedFormData[componentInstance.id],
                    translations: translationData[componentInstance.id]
                }
            })));
            
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