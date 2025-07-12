<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import { handleUploadFiles, handleDeleteFiles } from '@/services/file.service';
    import type { Component } from '@shared/types/pages.type';
    import ComponentRenderer from './components/ComponentRenderer.svelte';
    import { initializeFormData } from './utils/formHelpers';
    import { getAllFields } from './utils/formHelpers';
    import { processFileUploads } from './utils/formHelpers';
    import { CSS_CLASSES } from './constants';
    import { setContext } from 'svelte';
    import { writable } from 'svelte/store';

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];

    let formData: FormData = initializeFormData(config.components, components);
    let isSubmitting = false;
    
    const fileUploadState = writable<Record<string, { pendingFiles: File[]; filesToDelete: string[] }>>({});
    setContext('fileUploadState', fileUploadState);

    async function handleSubmit() {
        try {
            isSubmitting = true;
            
            // Get current file upload state
            const currentFileState: Record<string, { pendingFiles: File[]; filesToDelete: string[] }> = {};
            fileUploadState.subscribe(state => {
                Object.assign(currentFileState, state);
            })();
            
            // Process file uploads for each component
            const processedFormData = { ...formData };
            
            for (const componentInstance of config.components) {
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
                
                // Process file uploads recursively (including nested fields in RepeatableField)
                componentFormData = await processFileUploads(
                    componentInstance.component.schema,
                    componentInstance.id,
                    componentFormData,
                    currentFileState,
                    handleUploadFiles,
                    handleDeleteFiles
                );
                
                processedFormData[componentInstance.id] = componentFormData;
            }
            
            const updatedComponents: Component[] = config.components.map(componentInstance => ({
                componentName: componentInstance.component.name,
                instanceId: componentInstance.id,
                displayName: componentInstance.displayName || componentInstance.component.name,
                formData: processedFormData[componentInstance.id] || {}
            }));
            
            await handleUpdateComponents(slug, updatedComponents);
            
            // Update local form data and clear file upload state
            formData = processedFormData;
            fileUploadState.set({});
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