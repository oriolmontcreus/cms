<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import { handleDeleteFiles, handleUploadFiles } from '@/services/file.service';
    import type { Component } from '@shared/types/pages.type';
    import ComponentRenderer from './components/ComponentRenderer.svelte';
    import { initializeFormData, getAllFields, collectFilesForDeletion, type FormBuilderContext } from './utils/formHelpers';
    import { CSS_CLASSES } from './constants';
    import { writable } from 'svelte/store';
    import { setContext } from 'svelte';

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];

    let formData: FormData = initializeFormData(config.components, components);
    let isSubmitting = false;

    const filesToDelete = writable<string[]>([]);

    const formBuilderContext: FormBuilderContext = {
        collectFilesForDeletion: (itemData: any) => {
            collectFilesForDeletion(itemData, (fileIds: string[]) => {
                filesToDelete.update(current => [...current, ...fileIds]);
            });
        }
    };
    setContext('formBuilder', formBuilderContext);

    // Helper function to find and upload File objects in form data
    async function uploadPendingFiles(data: any, fieldConfig?: any): Promise<any> {
        if (!data || typeof data !== 'object') return data;
        
        if (data instanceof File) {
            // Upload single file
            const uploadedFiles = await handleUploadFiles([data]);
            return uploadedFiles?.[0] || null;
        }
        
        if (Array.isArray(data)) {
            // Handle arrays - upload any File objects
            const result = [];
            for (const item of data) {
                if (item instanceof File) {
                    const uploadedFiles = await handleUploadFiles([item]);
                    if (uploadedFiles?.[0]) result.push(uploadedFiles[0]);
                } else {
                    result.push(await uploadPendingFiles(item));
                }
            }
            return result.length > 0 ? result : null;
        }
        
        // Handle objects recursively
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
            // Check if this is a file field and handle single file replacement
            if (value instanceof File) {
                // For single files, delete the existing file first if it exists
                const existingValue = formData[fieldConfig?.componentId]?.[key];
                if (existingValue && existingValue.id && !Array.isArray(existingValue)) {
                    await handleDeleteFiles([existingValue.id]);
                }
            }
            result[key] = await uploadPendingFiles(value);
        }
        return result;
    }

    async function handleSubmit() {
        try {
            isSubmitting = true;
            
            // Upload any pending files in the form data
            const processedFormData = { ...formData };
            for (const componentId of Object.keys(processedFormData)) {
                processedFormData[componentId] = await uploadPendingFiles(
                    processedFormData[componentId], 
                    { componentId }
                );
            }
            
            const updatedComponents: Component[] = config.components.map(componentInstance => {
                const allFields = getAllFields(componentInstance.component.schema);
                const colorFields = allFields.filter(field => field.type === 'color');
                
                // Validate and clean form data
                let componentFormData = { ...processedFormData[componentInstance.id] };
                
                // Ensure color fields only contain valid color strings
                for (const field of colorFields) {
                    const value = componentFormData[field.name];
                    if (value && typeof value !== 'string') {
                        console.warn(`Color field ${field.name} contains non-string value:`, value, 'Resetting to empty string');
                        componentFormData[field.name] = '';
                    }
                }
                
                return {
                    componentName: componentInstance.component.name,
                    instanceId: componentInstance.id,
                    displayName: componentInstance.displayName || componentInstance.component.name,
                    formData: componentFormData
                };
            });
            
            // Save form data
            await handleUpdateComponents(slug, updatedComponents);
            
            // After successful save, delete all files marked for deletion
            const fileIdsToDelete = $filesToDelete;
            
            if (fileIdsToDelete.length > 0) {
                await handleDeleteFiles(fileIdsToDelete);
                // Clear the deletion queue after successful deletion
                filesToDelete.set([]);
            }
            
        } catch (error) {
            console.error('Error saving components:', error);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<form class={CSS_CLASSES.FORM_CONTAINER} on:submit|preventDefault={handleSubmit}>
    {#each config.components as componentInstance (componentInstance.id)}
        <ComponentRenderer 
            {componentInstance} 
            {formData}
        />
    {/each}

    <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
    </Button>
</form> 