<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import { handleDeleteFiles } from '@/services/file.service';
    import type { Component } from '@shared/types/pages.type';
    import ComponentRenderer from './components/ComponentRenderer.svelte';
    import { initializeFormData } from './utils/formHelpers';
    import { getAllFields } from './utils/formHelpers';
    import { CSS_CLASSES } from './constants';
    import { writable } from 'svelte/store';

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];

    let formData: FormData = initializeFormData(config.components, components);
    let isSubmitting = false;

    const filesToDelete = writable<string[]>([]);

    function collectFilesForDeletion(itemData: any) {
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
                    // Recursively check nested objects
                    else {
                        extractFileIds(value);
                    }
                }
            }
        }
        
        extractFileIds(itemData);
        
        if (fileIds.length > 0) {
            filesToDelete.update(current => [...current, ...fileIds]);
        }
    }

    async function handleSubmit() {
        try {
            isSubmitting = true;
            
            const updatedComponents: Component[] = config.components.map(componentInstance => {
                const allFields = getAllFields(componentInstance.component.schema);
                const colorFields = allFields.filter(field => field.type === 'color');
                
                // Validate and clean form data
                let componentFormData = { ...formData[componentInstance.id] };
                
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
            
            // Save form data first
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

    // Make functions available to child components
    $: formBuilderContext = {
        collectFilesForDeletion
    };
</script>

<form class={CSS_CLASSES.FORM_CONTAINER} on:submit|preventDefault={handleSubmit}>
    {#each config.components as componentInstance (componentInstance.id)}
        <ComponentRenderer 
            {componentInstance} 
            {formData}
            {formBuilderContext}
        />
    {/each}

    <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
    </Button>
</form> 