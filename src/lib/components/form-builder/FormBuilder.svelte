<script lang="ts">
    import type { PageConfig, FormData, TranslationData } from './types';
    import { RenderMode } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import { handleDeleteFiles, handleUploadFiles } from '@/services/file.service';
    import type { Component } from '@/lib/shared/types/pages.type';
    import type { UploadedFileWithDeletionFlag } from '@/lib/shared/types/file.type';
    import ComponentRenderer from './components/ComponentRenderer.svelte';
    import { initializeFormData, initializeTranslationData, collectFilesForDeletion, convertTranslationDataForSaving, type FormBuilderContext } from './utils/formHelpers';
    import { CSS_CLASSES } from './constants';
    import { writable } from 'svelte/store';
    import { setContext, onMount } from 'svelte';
    import { SITE_LOCALES, CMS_LOCALE } from '@/lib/shared/env';
    import { IconChevronDown, IconChevronUp } from '@tabler/icons-svelte';

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];
    export let mode: RenderMode = RenderMode.CONTENT;
    export let isSubmitting = false;

    // Initialize data once on component creation
    let formData: FormData = initializeFormData(config.components, components);
    let translationData: TranslationData = initializeTranslationData(config.components, components, SITE_LOCALES);

    // Collapse state management
    const STORAGE_KEY = `component-collapse-${slug}`;
    let componentCollapseState: Record<string, boolean> = {};

    // Load collapse state from localStorage
    onMount(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                componentCollapseState = JSON.parse(saved);
            }
            // Set default collapsed state for new components
            config.components.forEach(comp => {
                if (!(comp.id in componentCollapseState)) {
                    componentCollapseState[comp.id] = true; // Default: collapsed
                }
            });
        } catch (error) {
            console.warn('Failed to load component collapse state:', error);
            // Default all components to collapsed
            config.components.forEach(comp => {
                componentCollapseState[comp.id] = true;
            });
        }
    });

    // Save collapse state to localStorage
    function saveCollapseState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(componentCollapseState));
        } catch (error) {
            console.warn('Failed to save component collapse state:', error);
        }
    }

    // Toggle individual component collapse state
    function toggleComponentCollapse(componentId: string) {
        componentCollapseState[componentId] = !componentCollapseState[componentId];
        saveCollapseState();
    }

    // Collapse all components
    function collapseAll() {
        config.components.forEach(comp => {
            componentCollapseState[comp.id] = true;
        });
        saveCollapseState();
    }

    // Expand all components
    function expandAll() {
        config.components.forEach(comp => {
            componentCollapseState[comp.id] = false;
        });
        saveCollapseState();
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

    // Single reactive statement to handle all form data updates
    $: if (config.components && formData && mode === RenderMode.CONTENT) {
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

    // Helper function to collect all files that need to be uploaded
    function collectPendingFiles(data: any): File[] {
        const files: File[] = [];
        
        function traverse(value: any) {
            if (!value || typeof value !== 'object') return;
            
            if (value instanceof File) {
                files.push(value);
                return;
            }
            
            if (Array.isArray(value)) {
                value.forEach(item => traverse(item));
                return;
            }
            
            Object.values(value).forEach(val => traverse(val));
        }
        
        traverse(data);
        return files;
    }

    // Helper function to mark files for deletion
    function markFilesForDeletion(data: any) {
        function traverse(value: any) {
            if (!value || typeof value !== 'object') return;
            
            if ((value as UploadedFileWithDeletionFlag)._markedForDeletion && (value as UploadedFileWithDeletionFlag).id) {
                filesToDelete.update(current => [...current, (value as UploadedFileWithDeletionFlag).id]);
                return;
            }
            
            if (Array.isArray(value)) {
                value.forEach(item => traverse(item));
                return;
            }
            
            Object.values(value).forEach(val => traverse(val));
        }
        
        traverse(data);
    }

    // Helper function to replace file references in data
    function replaceFileReferences(data: any, fileMap: Map<File, any>): any {
        if (!data || typeof data !== 'object') return data;
        
        if (data instanceof File) {
            return fileMap.get(data) || null;
        }
        
        if (Array.isArray(data)) {
            return data.map(item => replaceFileReferences(item, fileMap));
        }
        
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
            if ((value as UploadedFileWithDeletionFlag)?._markedForDeletion) {
                result[key] = null;
            } else {
                result[key] = replaceFileReferences(value, fileMap);
            }
        }
        return result;
    }

    async function uploadPendingFiles(data: any): Promise<any> {
        console.log('[FormBuilder] uploadPendingFiles called');
        
        // Step 1: Collect all files that need to be uploaded
        const pendingFiles = collectPendingFiles(data);
        
        // Step 2: Mark files for deletion
        markFilesForDeletion(data);
        
        // Step 3: Upload all files in a single batch
        const uploadedFiles = pendingFiles.length > 0 ? (await handleUploadFiles(pendingFiles) || []) : [];
        
        // Step 4: Create a map of original files to their uploaded versions
        const fileMap = new Map(pendingFiles.map((file, index) => [file, uploadedFiles[index]]));
        
        // Step 5: Replace all file references in the data structure
        return replaceFileReferences(data, fileMap);
    }

    export async function handleSubmit() {
        console.log('[FormBuilder] handleSubmit called');
        try {
            isSubmitting = true;
            
            // Process all form data at once
            const processedFormData = { ...formData };
            for (const componentId of Object.keys(processedFormData)) {
                processedFormData[componentId] = await uploadPendingFiles(processedFormData[componentId]);
            }
            
            const updatedComponents = await Promise.all(config.components.map(async componentInstance => {
                // Convert translation data to proper structure for saving
                const convertedTranslations = convertTranslationDataForSaving(
                    { [componentInstance.id]: translationData[componentInstance.id] || {} },
                    componentInstance
                );
                
                return {
                    componentName: componentInstance.component.name,
                    instanceId: componentInstance.id,
                    displayName: componentInstance.displayName || componentInstance.component.name,
                    formData: {
                        ...processedFormData[componentInstance.id],
                        translations: convertedTranslations[componentInstance.id] || {}
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
    <!-- Collapse/Expand Controls -->
    <div class="flex gap-2 mb-4">
        <Button
            variant="outline"
            size="sm"
            onclick={collapseAll}
        >
            <IconChevronUp class="h-4 w-4 mr-2" />
            Collapse all
        </Button>
        <Button
            variant="outline"
            size="sm"
            onclick={expandAll}
        >
            <IconChevronDown class="h-4 w-4 mr-2" />
            Expand all
        </Button>
    </div>

    {#each config.components as componentInstance (componentInstance.id)}
        <ComponentRenderer 
            {componentInstance} 
            {formData}
            {mode}
            {translationData}
            locales={SITE_LOCALES}
            isCollapsed={componentCollapseState[componentInstance.id] ?? true}
            onToggleCollapse={() => toggleComponentCollapse(componentInstance.id)}
        />
    {/each}
</div> 