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
    import { validateFormData, type ValidationError } from "./utils/validation";
    import { errorToast } from "@/services/toast.service";
    import { CSS_CLASSES } from "./constants";
    import { writable } from "svelte/store";
    import { setContext, onMount } from "svelte";
    import { SITE_LOCALES, CMS_LOCALE } from "@shared/env";
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
    let translationData: TranslationData = {};
    let translationDataInitialized = false;

    // Validation state
    let validationErrors: Record<string, string> = {};
    let hasValidationErrors = false;

    const STORAGE_KEY = `component-collapse-${slug}`;
    let componentCollapseState: Record<string, boolean> = {};

    // Get configuration options
    $: defaultExpanded = config.formBuilder?.defaultExpanded ?? false;
    $: hideComponentTitles = config.formBuilder?.hideComponentTitles ?? false;
    $: disableCollapsible = config.formBuilder?.disableCollapsible ?? false;

    onMount(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && !disableCollapsible) {
                componentCollapseState = JSON.parse(saved);
            }
            config.components.forEach((comp) => {
                if (!(comp.id in componentCollapseState)) {
                    componentCollapseState[comp.id] = disableCollapsible
                        ? false
                        : !defaultExpanded;
                }
            });
        } catch (error) {
            console.warn("Failed to load component collapse state:", error);
            config.components.forEach((comp) => {
                componentCollapseState[comp.id] = disableCollapsible
                    ? false
                    : !defaultExpanded;
            });
        }
    });

    function saveCollapseState() {
        if (disableCollapsible) return;
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
        if (disableCollapsible) return;
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
    $: showCollapseButton = !disableCollapsible && !allCollapsed;
    $: showExpandButton = !disableCollapsible && !allExpanded;

    const filesToDelete = writable<string[]>([]);

    const formBuilderContext: FormBuilderContext = {
        collectFilesForDeletion: (itemData: any) => {
            collectFilesForDeletion(itemData, (fileIds: string[]) => {
                filesToDelete.update((current) => [...current, ...fileIds]);
            });
        },
        saveTranslations: saveTranslations,
    };
    setContext("formBuilder", formBuilderContext);

    // Lazy initialization of translation data when translation mode is first activated
    function initializeTranslationDataIfNeeded() {
        if (!translationDataInitialized) {
            translationData = initializeTranslationDataOptimized(
                config.components,
                components,
                SITE_LOCALES,
            );
            translationDataInitialized = true;
        }
    }

    // Initialize translation data when switching to translation mode
    $: if (mode === RenderMode.TRANSLATION) {
        initializeTranslationDataIfNeeded();
    }

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

        // If this is an uploaded file object that was marked for deletion, remove reference
        if ((data as UploadedFileWithDeletionFlag)?._markedForDeletion) {
            return null; // signal removal for single file fields; filtered out for arrays
        }

        if (data instanceof File) {
            return fileMap.get(data) || null;
        }

        if (Array.isArray(data)) {
            // Map then filter out any nulls produced by marked-for-deletion items
            return data
                .map((item) => replaceFileReferences(item, fileMap))
                .filter((item) => item !== null && item !== undefined);
        }

        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = replaceFileReferences(value, fileMap);
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

    /**
     * Validates all form data and updates validation state
     */
    async function validateForm(dataToValidate: any): Promise<boolean> {
        // Clear previous validation errors
        validationErrors = {};
        hasValidationErrors = false;

        // Validate each component's data
        for (const componentInstance of config.components) {
            const componentData = dataToValidate[componentInstance.id] || {};
            const componentSchema = componentInstance.component.schema;

            const validation = validateFormData(componentSchema, componentData);

            if (!validation.isValid) {
                validation.errors.forEach((error) => {
                    const fullFieldKey = `${componentInstance.id}.${error.field}`;
                    validationErrors[fullFieldKey] = error.message;
                });
            }
        }

        hasValidationErrors = Object.keys(validationErrors).length > 0;

        if (hasValidationErrors) {
            const errorCount = Object.keys(validationErrors).length;
            errorToast(
                `Found ${errorCount} validation error${errorCount > 1 ? "s" : ""}. Please fix them before saving.`,
            );
        }

        return !hasValidationErrors;
    }

    export async function handleSubmit(forced = false) {
        // Only prevent auto-submit in translation mode, but allow manual saves
        if (mode === RenderMode.TRANSLATION && !forced) {
            return;
        }

        // If in translation mode and forced (manual save), ensure translation data is updated first
        if (mode === RenderMode.TRANSLATION && forced) {
            // Trigger all TranslationModeWrapper components to update their translation data
            const event = new CustomEvent("updateTranslationData");
            document.dispatchEvent(event);

            // Give a small delay to ensure the update completes
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Validate form data before saving
        const dataToValidate =
            mode === RenderMode.TRANSLATION ? translationData : formData;
        const isValid = await validateForm(dataToValidate);

        if (!isValid) {
            return; // Don't save if validation fails
        }

        await saveFormData();
    }

    // Add a separate function that can be called from translation mode
    export async function saveTranslations() {
        await saveFormData();
    }

    async function saveFormData() {
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
    <div class="flex gap-2 mb-4 overflow-hidden">
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
            isCollapsed={componentCollapseState[componentInstance.id] ??
                !defaultExpanded}
            {disableCollapsible}
            {hideComponentTitles}
            onToggleCollapse={() =>
                toggleComponentCollapse(componentInstance.id)}
            {validationErrors}
        />
    {/each}
</div>
