<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import { handleDeleteFiles } from '@/services/file.service';
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