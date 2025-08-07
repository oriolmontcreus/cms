<script lang="ts">
    import type { FormData, TranslationData } from "../types";
    import { RenderMode } from "../types";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import UnifiedRenderer from "./UnifiedRenderer.svelte";
    import GridLayout from "../layouts/GridLayout.svelte";
    import TabsLayout from "../layouts/TabsLayout.svelte";
    import {
        usesFilamentTabsOptimized as usesFilamentTabs,
        usesMixedSchemaOptimized as usesMixedSchema,
        getComponentAnalysis,
        getFieldDefaultValue,
    } from "../utils/optimizedSchemaProcessor";
    import { CSS_CLASSES, SCHEMA_TYPES } from "../constants";
    import { CMS_LOCALE } from "@/lib/shared/env";
    import type { FormBuilderContext } from "../utils/formHelpers";
    import { getContext, onMount, onDestroy } from "svelte";

    export let componentInstance: any;
    export let formData: FormData;
    export let translationData: TranslationData = {};
    export let locales: readonly { code: string; name: string }[] = [];

    const formBuilderContext = getContext<FormBuilderContext>("formBuilder");

    $: componentAnalysis = getComponentAnalysis(componentInstance.component);
    $: regularTranslatableFields = componentAnalysis.translatableFields.filter(
        (f) => f.type !== "repeater",
    );
    $: repeaterFieldsWithTranslatableContent = componentAnalysis.repeaterFields;
    $: hasTranslatableContent =
        regularTranslatableFields.length > 0 ||
        repeaterFieldsWithTranslatableContent.length > 0;

    let activeLocale =
        locales.find((l) => l.code !== CMS_LOCALE)?.code ||
        locales[0]?.code ||
        "";

    function handleLocaleChange(newLocale: string | undefined) {
        console.log("executing handleLocaleChange");
        if (newLocale) {
            activeLocale = newLocale;
        }
    }

    let localeFormData: Record<string, any> = {};
    let previousLocaleFormData: string = "";
    let isInitialLoad = true;
    let lastActiveLocale = activeLocale; //Track locale changes

    // Only rebuild form data when activeLocale actually changes
    $: if (activeLocale !== lastActiveLocale || isInitialLoad) {
        console.log("executing reactive locale change");
        lastActiveLocale = activeLocale;
        rebuildLocaleFormData();
    }

    function rebuildLocaleFormData() {
        console.log("executing rebuildLocaleFormData");
        const contentData = formData[componentInstance.id] || {};
        const isDefaultLocale = activeLocale === CMS_LOCALE;

        if (isDefaultLocale) {
            localeFormData = contentData;
        } else {
            // Get translations from FormBuilder's translationData
            const translations =
                translationData[componentInstance.id]?.[activeLocale] || {};
            const mergedData = { ...contentData };

            // Apply translations for regular translatable fields
            regularTranslatableFields.forEach((field) => {
                if (translations[field.name] !== undefined) {
                    mergedData[field.name] = translations[field.name];
                } else {
                    mergedData[field.name] = getFieldDefaultValue(field);
                }
            });

            // Apply translations for repeater fields using indexed keys
            repeaterFieldsWithTranslatableContent.forEach((repeaterField) => {
                const repeaterItems = contentData[repeaterField.name] || [];
                if (Array.isArray(repeaterItems)) {
                    const translatedItems = repeaterItems.map(
                        (item, itemIndex) => {
                            const itemKey = `${repeaterField.name}_${itemIndex}`;
                            const itemTranslation = translations[itemKey] || {};
                            const translatedItem = { ...item };

                            // Get all translatable fields in this repeater's schema
                            const nestedAnalysis = getComponentAnalysis({
                                schema: repeaterField.schema || [],
                            });

                            nestedAnalysis.translatableFields.forEach(
                                (nestedField) => {
                                    if (nestedField.type !== "repeater") {
                                        if (
                                            itemTranslation[
                                                nestedField.name
                                            ] !== undefined
                                        ) {
                                            translatedItem[nestedField.name] =
                                                itemTranslation[
                                                    nestedField.name
                                                ];
                                        } else {
                                            translatedItem[nestedField.name] =
                                                getFieldDefaultValue(
                                                    nestedField,
                                                );
                                        }
                                    }
                                },
                            );

                            // Handle nested repeater fields (like featureCards inside heroSections)
                            nestedAnalysis.repeaterFields.forEach(
                                (nestedRepeaterField) => {
                                    const nestedRepeaterItems =
                                        item[nestedRepeaterField.name] || [];
                                    if (Array.isArray(nestedRepeaterItems)) {
                                        const translatedNestedItems =
                                            nestedRepeaterItems.map(
                                                (
                                                    nestedItem,
                                                    nestedItemIndex,
                                                ) => {
                                                    const nestedItemKey = `${nestedRepeaterField.name}_${nestedItemIndex}`;
                                                    const nestedItemTranslation =
                                                        itemTranslation[
                                                            nestedItemKey
                                                        ] || {};
                                                    const translatedNestedItem =
                                                        { ...nestedItem };

                                                    // Get translatable fields in the nested repeater
                                                    const deepAnalysis =
                                                        getComponentAnalysis({
                                                            schema:
                                                                nestedRepeaterField.schema ||
                                                                [],
                                                        });

                                                    deepAnalysis.translatableFields.forEach(
                                                        (deepField) => {
                                                            if (
                                                                deepField.type !==
                                                                "repeater"
                                                            ) {
                                                                if (
                                                                    nestedItemTranslation[
                                                                        deepField
                                                                            .name
                                                                    ] !==
                                                                    undefined
                                                                ) {
                                                                    translatedNestedItem[
                                                                        deepField.name
                                                                    ] =
                                                                        nestedItemTranslation[
                                                                            deepField.name
                                                                        ];
                                                                } else {
                                                                    translatedNestedItem[
                                                                        deepField.name
                                                                    ] =
                                                                        getFieldDefaultValue(
                                                                            deepField,
                                                                        );
                                                                }
                                                            }
                                                        },
                                                    );

                                                    return translatedNestedItem;
                                                },
                                            );
                                        translatedItem[
                                            nestedRepeaterField.name
                                        ] = translatedNestedItems;
                                    }
                                },
                            );

                            return translatedItem;
                        },
                    );
                    mergedData[repeaterField.name] = translatedItems;
                }
            });

            localeFormData = mergedData;
        }

        // Mark initial load as complete after the first run
        if (isInitialLoad) {
            setTimeout(() => {
                isInitialLoad = false;
                // Store the initial state
                previousLocaleFormData = JSON.stringify(localeFormData);
            }, 100);
        }
    }

    // Remove the reactive statement that was causing excessive calls
    // The translation data structure will be updated only when needed:
    // 1. When switching locales (handled in rebuildLocaleFormData)
    // 2. When explicitly saving (handled in saveTranslations)
    // 3. When handling update events (handled in handleUpdateTranslationDataEvent)

    // Update the internal translation data structure without saving to backend
    function updateTranslationDataStructure() {
        console.log("executing updateTranslationDataStructure");
        if (!translationData[componentInstance.id]) {
            translationData[componentInstance.id] = {};
        }
        if (!translationData[componentInstance.id][activeLocale]) {
            translationData[componentInstance.id][activeLocale] = {};
        }

        const translations =
            translationData[componentInstance.id][activeLocale];

        // Update regular translatable fields
        regularTranslatableFields.forEach((field) => {
            if (localeFormData[field.name] !== undefined) {
                translations[field.name] = localeFormData[field.name];
            }
        });

        // Update repeater field translations
        repeaterFieldsWithTranslatableContent.forEach((repeaterField) => {
            const repeaterItems = localeFormData[repeaterField.name] || [];

            if (Array.isArray(repeaterItems)) {
                repeaterItems.forEach((item, itemIndex) => {
                    const itemKey = `${repeaterField.name}_${itemIndex}`;
                    if (!translations[itemKey]) {
                        translations[itemKey] = {};
                    }

                    const itemTranslation = translations[itemKey];

                    // Update translatable fields from this repeater item
                    const nestedAnalysis = getComponentAnalysis({
                        schema: repeaterField.schema || [],
                    });

                    nestedAnalysis.translatableFields.forEach((nestedField) => {
                        if (
                            nestedField.type !== "repeater" &&
                            item[nestedField.name] !== undefined
                        ) {
                            itemTranslation[nestedField.name] =
                                item[nestedField.name];
                        }
                    });

                    // Update nested repeater field translations
                    nestedAnalysis.repeaterFields.forEach(
                        (nestedRepeaterField) => {
                            const nestedRepeaterItems =
                                item[nestedRepeaterField.name] || [];

                            if (Array.isArray(nestedRepeaterItems)) {
                                nestedRepeaterItems.forEach(
                                    (nestedItem, nestedItemIndex) => {
                                        const nestedItemKey = `${nestedRepeaterField.name}_${nestedItemIndex}`;
                                        if (!itemTranslation[nestedItemKey]) {
                                            itemTranslation[nestedItemKey] = {};
                                        }

                                        const nestedItemTranslation =
                                            itemTranslation[nestedItemKey];

                                        // Update deep translatable fields
                                        const deepAnalysis =
                                            getComponentAnalysis({
                                                schema:
                                                    nestedRepeaterField.schema ||
                                                    [],
                                            });

                                        deepAnalysis.translatableFields.forEach(
                                            (deepField) => {
                                                if (
                                                    deepField.type !==
                                                        "repeater" &&
                                                    nestedItem[
                                                        deepField.name
                                                    ] !== undefined
                                                ) {
                                                    nestedItemTranslation[
                                                        deepField.name
                                                    ] =
                                                        nestedItem[
                                                            deepField.name
                                                        ];
                                                }
                                            },
                                        );
                                    },
                                );
                            }
                        },
                    );
                });
            }
        });
    }

    // This function is called by FormBuilder's saveTranslations context function
    // The translation data is already updated by updateTranslationDataStructure()
    async function saveTranslations() {
        console.log("executing saveTranslations");

        // Make sure the translation data is up to date
        updateTranslationDataStructure();

        // The FormBuilder will handle converting and saving to backend
        if (formBuilderContext?.saveTranslations) {
            await formBuilderContext.saveTranslations();
        }
    }

    // Handle the translation data update event from FormBuilder
    function handleUpdateTranslationDataEvent() {
        console.log("executing handleUpdateTranslationDataEvent");
        updateTranslationDataStructure();
    }

    onMount(() => {
        document.addEventListener(
            "updateTranslationData",
            handleUpdateTranslationDataEvent,
        );
    });

    onDestroy(() => {
        document.removeEventListener(
            "updateTranslationData",
            handleUpdateTranslationDataEvent,
        );
    });
</script>

{#if hasTranslatableContent}
    <div class="mb-4 flex gap-4 items-center">
        <div class="w-48">
            <Select
                type="single"
                value={activeLocale}
                onValueChange={handleLocaleChange}
            >
                <SelectTrigger class="w-full">
                    {#if activeLocale}
                        {@const currentLocale = locales.find(
                            (l) => l.code === activeLocale,
                        )}
                        <span class="flex items-center gap-2">
                            {currentLocale?.name || "Select Language"}
                            {#if activeLocale === CMS_LOCALE}
                                <span class="text-xs opacity-60">(default)</span
                                >
                            {/if}
                        </span>
                    {:else}
                        <span>Select Language</span>
                    {/if}
                </SelectTrigger>
                <SelectContent>
                    {#each locales as locale}
                        <SelectItem value={locale.code} label={locale.name}>
                            <span class="flex items-center gap-2">
                                {locale.name}
                                {#if locale.code === CMS_LOCALE}
                                    <span class="text-xs opacity-60"
                                        >(default)</span
                                    >
                                {/if}
                            </span>
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>
    </div>

    {#if componentInstance.component}
        {@const schema = Array.isArray(componentInstance.component.schema)
            ? componentInstance.component.schema
            : [componentInstance.component.schema]}
        <UnifiedRenderer
            {schema}
            componentId={componentInstance.id}
            bind:formData={localeFormData}
            mode={RenderMode.TRANSLATION}
            currentLocale={activeLocale}
            isDefaultLocale={activeLocale === CMS_LOCALE}
            {translationData}
        />
    {/if}
{:else}
    <div
        class="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/10"
    >
        This component has no translatable fields.
    </div>
{/if}
