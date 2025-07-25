<script lang="ts">
    import type { PageConfig, FormData, TranslationData } from "./types";
    import { RenderMode } from "./types";
    import { Button } from "@components/ui/button";
    import { handleUpdateComponents } from "@/services/page.service";
    import {
        handleDeleteFiles,
        handleUploadFiles,
    } from "@/services/file.service";
    import type { Component } from "@/lib/shared/types/pages.type";
    import type { UploadedFileWithDeletionFlag } from "@/lib/shared/types/file.type";
    import ComponentRenderer from "./components/ComponentRenderer.svelte";
    import {
        collectFilesForDeletion,
        convertTranslationDataForSaving,
        type FormBuilderContext,
    } from "./utils/formHelpers";
    import {
        initializeFormDataOptimized,
        initializeTranslationDataOptimized,
    } from "./utils/optimizedSchemaProcessor";
    import { CSS_CLASSES } from "./constants";
    import { writable } from "svelte/store";
    import { setContext, onMount } from "svelte";
    import { SITE_LOCALES, CMS_LOCALE } from "@/lib/shared/env";
    import { IconChevronDown, IconChevronUp } from "@tabler/icons-svelte";
    import { slide, fade } from "svelte/transition";

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];
    export let mode: RenderMode = RenderMode.CONTENT;
    export let isSubmitting = false;

    let formData: FormData = initializeFormDataOptimized(
        config.components,
        components,
    );
    let translationData: TranslationData = initializeTranslationDataOptimized(
        config.components,
        components,
        SITE_LOCALES,
    );

    const STORAGE_KEY = `component-collapse-${slug}`;
    let componentCollapseState: Record<string, boolean> = {};
    onMount(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                componentCollapseState = JSON.parse(saved);
            }
            config.components.forEach((comp) => {
                if (!(comp.id in componentCollapseState)) {
                    componentCollapseState[comp.id] = true;
                }
            });
        } catch (error) {
            console.warn("Failed to load component collapse state:", error);
            config.components.forEach((comp) => {
                componentCollapseState[comp.id] = true;
            });
        }
    });

    function saveCollapseState() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(componentCollapseState),
            );
        } catch (error) {
            console.warn("Failed to save component collapse state:", error);
        }
    }

    function toggleComponentCollapse(componentId: string) {
        componentCollapseState[componentId] =
            !componentCollapseState[componentId];
        saveCollapseState();
    }

    function collapseAll() {
        config.components.forEach((comp) => {
            componentCollapseState[comp.id] = true;
        });
        saveCollapseState();
    }

    function expandAll() {
        config.components.forEach((comp) => {
            componentCollapseState[comp.id] = false;
        });
        saveCollapseState();
    }

    $: allCollapsed = config.components.every(
        (comp) => componentCollapseState[comp.id] !== false,
    );
    $: allExpanded = config.components.every(
        (comp) => componentCollapseState[comp.id] === false,
    );
    $: showCollapseButton = !allCollapsed;
    $: showExpandButton = !allExpanded;

    const filesToDelete = writable<string[]>([]);

    const formBuilderContext: FormBuilderContext = {
        collectFilesForDeletion: (itemData: any) => {
            collectFilesForDeletion(itemData, (fileIds: string[]) => {
                filesToDelete.update((current) => [...current, ...fileIds]);
            });
        },
    };
    setContext("formBuilder", formBuilderContext);

    // Optimized reactive statement with more selective updates
    // Only sync when formData actually changes and in content mode
    let lastFormDataString = "";
    $: if (config.components && formData && mode === RenderMode.CONTENT) {
        const currentFormDataString = JSON.stringify(formData);
        if (currentFormDataString !== lastFormDataString) {
            console.log("[FormBuilder] Form data sync executed");
            lastFormDataString = currentFormDataString;
            syncTranslationData();
        }
    }

    function syncTranslationData() {
        config.components.forEach((componentInstance) => {
            const componentFormData = formData[componentInstance.id] || {};

            // Initialize component translation data if needed
            if (!translationData[componentInstance.id]) {
                translationData[componentInstance.id] = {};
            }

            // Handle repeater items efficiently
            Object.entries(componentFormData).forEach(([fieldName, items]) => {
                if (Array.isArray(items)) {
                    items.forEach((item: any, itemIndex: number) => {
                        const key = `${fieldName}_${itemIndex}`;

                        // Initialize locale data in batch
                        SITE_LOCALES.forEach((locale) => {
                            if (locale.code !== CMS_LOCALE) {
                                if (
                                    !translationData[componentInstance.id][
                                        locale.code
                                    ]
                                ) {
                                    translationData[componentInstance.id][
                                        locale.code
                                    ] = {};
                                }
                                if (
                                    !translationData[componentInstance.id][
                                        locale.code
                                    ][key]
                                ) {
                                    translationData[componentInstance.id][
                                        locale.code
                                    ][key] = {};
                                }
                            }
                        });
                    });
                }
            });

            // Sync CMS locale data efficiently
            if (!translationData[componentInstance.id][CMS_LOCALE]) {
                translationData[componentInstance.id][CMS_LOCALE] = {};
            }

            Object.entries(componentFormData).forEach(([fieldName, value]) => {
                if (
                    translationData[componentInstance.id][CMS_LOCALE][
                        fieldName
                    ] !== value
                ) {
                    translationData[componentInstance.id][CMS_LOCALE][
                        fieldName
                    ] = value;
                }
            });
        });
    }

    // Optimized file collection using Set for better performance
    function collectPendingFiles(data: any): File[] {
        const files: File[] = [];
        const visited = new WeakSet();

        function traverse(value: any) {
            if (!value || typeof value !== "object" || visited.has(value))
                return;
            visited.add(value);

            if (value instanceof File) {
                files.push(value);
                return;
            }

            if (Array.isArray(value)) {
                value.forEach(traverse);
                return;
            }

            Object.values(value).forEach(traverse);
        }

        traverse(data);
        return files;
    }

    function markFilesForDeletion(data: any) {
        const visited = new WeakSet();

        function traverse(value: any) {
            if (!value || typeof value !== "object" || visited.has(value))
                return;
            visited.add(value);

            if (
                (value as UploadedFileWithDeletionFlag)._markedForDeletion &&
                (value as UploadedFileWithDeletionFlag).id
            ) {
                filesToDelete.update((current) => [
                    ...current,
                    (value as UploadedFileWithDeletionFlag).id,
                ]);
                return;
            }

            if (Array.isArray(value)) {
                value.forEach(traverse);
                return;
            }

            Object.values(value).forEach(traverse);
        }

        traverse(data);
    }

    function replaceFileReferences(data: any, fileMap: Map<File, any>): any {
        if (!data || typeof data !== "object") return data;

        if (data instanceof File) {
            return fileMap.get(data) || null;
        }

        if (Array.isArray(data)) {
            return data.map((item) => replaceFileReferences(item, fileMap));
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
        console.log("[FormBuilder] uploadPendingFiles called");

        const pendingFiles = collectPendingFiles(data);
        markFilesForDeletion(data);

        const uploadedFiles =
            pendingFiles.length > 0
                ? (await handleUploadFiles(pendingFiles)) || []
                : [];
        const fileMap = new Map(
            pendingFiles.map((file, index) => [file, uploadedFiles[index]]),
        );

        return replaceFileReferences(data, fileMap);
    }

    export async function handleSubmit() {
        console.log("[FormBuilder] handleSubmit called");
        const originalFormData = { ...formData }; // Backup original form data
        try {
            isSubmitting = true;

            const processedFormData = { ...formData };
            for (const componentId of Object.keys(processedFormData)) {
                processedFormData[componentId] = await uploadPendingFiles(
                    processedFormData[componentId],
                );
            }

            formData = { ...processedFormData };

            const updatedComponents = await Promise.all(
                config.components.map(async (componentInstance) => {
                    const convertedTranslations =
                        convertTranslationDataForSaving(
                            {
                                [componentInstance.id]:
                                    translationData[componentInstance.id] || {},
                            },
                            componentInstance,
                        );

                    return {
                        componentName: componentInstance.component.name,
                        instanceId: componentInstance.id,
                        displayName:
                            componentInstance.displayName ||
                            componentInstance.component.name,
                        formData: {
                            ...processedFormData[componentInstance.id],
                            translations:
                                convertedTranslations[componentInstance.id] ||
                                {},
                        },
                    };
                }),
            );

            await handleUpdateComponents(slug, updatedComponents);

            const fileIdsToDelete = $filesToDelete;
            if (fileIdsToDelete.length > 0) {
                await handleDeleteFiles(fileIdsToDelete);
                filesToDelete.set([]);
            }
        } catch (error) {
            console.error("Error saving components:", error);
            formData = originalFormData;
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class={CSS_CLASSES.FORM_CONTAINER}>
    <div class="flex gap-2 mb-4 min-h-[2.5rem] overflow-hidden">
        {#if showCollapseButton}
            <div
                transition:slide={{ duration: 200, axis: "x" }}
                class="flex-shrink-0"
            >
                <Button variant="outline" size="sm" onclick={collapseAll}>
                    <IconChevronUp class="h-4 w-4 mr-2" />
                    Collapse all
                </Button>
            </div>
        {/if}
        {#if showExpandButton}
            <div
                transition:slide={{ duration: 200, axis: "x" }}
                class="flex-shrink-0"
            >
                <Button variant="outline" size="sm" onclick={expandAll}>
                    <IconChevronDown class="h-4 w-4 mr-2" />
                    Expand all
                </Button>
            </div>
        {/if}
    </div>

    {#each config.components as componentInstance (componentInstance.id)}
        <ComponentRenderer
            {componentInstance}
            {formData}
            {mode}
            {translationData}
            locales={SITE_LOCALES}
            isCollapsed={componentCollapseState[componentInstance.id] ?? true}
            onToggleCollapse={() =>
                toggleComponentCollapse(componentInstance.id)}
        />
    {/each}
</div>
