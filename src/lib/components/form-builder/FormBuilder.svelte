<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import { handleUploadFiles, handleDeleteFiles } from '@/services/file.service';
    import type { Component } from '@shared/types/pages.type';
    import ComponentRenderer from './components/ComponentRenderer.svelte';
    import { initializeFormData } from './utils/formHelpers';
    import { getAllFields } from './utils/formHelpers';
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
                const fileFields = allFields.filter(field => field.type === 'file');
                
                if (fileFields.length > 0) {
                    const componentFormData = { ...processedFormData[componentInstance.id] };
                    
                    // Process each file field
                    for (const field of fileFields) {
                        const key = `${componentInstance.id}-${field.name}`;
                        const fileState = currentFileState[key];
                        
                        if (fileState) {
                            const { pendingFiles, filesToDelete } = fileState;
                            const currentValue = componentFormData[field.name];
                            
                            // Delete files marked for deletion
                            if (filesToDelete.length > 0) {
                                await handleDeleteFiles(filesToDelete);
                            }
                            
                            // Upload new files
                            let uploadedFiles: any[] = [];
                            if (pendingFiles.length > 0) {
                                const newUploadedFiles = await handleUploadFiles(pendingFiles);
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
                                componentFormData[field.name] = allFiles.length > 0 ? allFiles : null;
                            } else {
                                componentFormData[field.name] = allFiles.length > 0 ? allFiles[0] : null;
                            }
                        }
                    }
                    
                    processedFormData[componentInstance.id] = componentFormData;
                }
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