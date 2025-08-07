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
    import { getContext } from "svelte";

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
        if (newLocale) {
            activeLocale = newLocale;
        }
    }

    let localeFormData: Record<string, any> = {};
    let previousLocaleFormData: string = "";
    let isInitialLoad = true;

    // Simple approach: work with FormBuilder's translationData
    $: {
        const contentData = formData[componentInstance.id] || {};
        const isDefaultLocale = activeLocale === CMS_LOCALE;

        console.log("LOAD DEBUG - Loading for locale:", activeLocale);
        console.log(
            "LOAD DEBUG - translationData for component:",
            translationData[componentInstance.id],
        );
        console.log("LOAD DEBUG - Content data:", contentData);

        if (isDefaultLocale) {
            localeFormData = contentData;
        } else {
            // Get translations from FormBuilder's translationData
            const translations =
                translationData[componentInstance.id]?.[activeLocale] || {};
            const mergedData = { ...contentData };

            console.log("LOAD DEBUG - Available translations:", translations);

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

                            console.log(
                                "LOAD DEBUG - Loading repeater item:",
                                itemKey,
                                "translation:",
                                itemTranslation,
                            );

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

                                                    console.log(
                                                        "LOAD DEBUG - Loading nested repeater item:",
                                                        nestedItemKey,
                                                        "translation:",
                                                        nestedItemTranslation,
                                                    );

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
            console.log("INIT DEBUG - Setting up initial load timer");
            setTimeout(() => {
                console.log("INIT DEBUG - Marking initial load as complete");
                isInitialLoad = false;
                // Store the initial state
                previousLocaleFormData = JSON.stringify(localeFormData);
                console.log(
                    "INIT DEBUG - Stored initial state, length:",
                    previousLocaleFormData.length,
                );
            }, 100);
        }
    }

    // Save translations back to FormBuilder's translationData when form data changes
    // Only save when data has actually changed, not during initial load or mode switches
    $: if (activeLocale !== CMS_LOCALE && localeFormData && !isInitialLoad) {
        console.log("SAVE DEBUG - Reactive statement triggered", {
            activeLocale,
            isInitialLoad,
            hasLocaleFormData: !!localeFormData,
            localeFormDataPreview: JSON.stringify(localeFormData).substring(
                0,
                200,
            ),
        });

        const currentFormDataString = JSON.stringify(localeFormData);
        console.log("SAVE DEBUG - Checking for changes", {
            currentLength: currentFormDataString.length,
            previousLength: previousLocaleFormData.length,
            areEqual: currentFormDataString === previousLocaleFormData,
            currentPreview: currentFormDataString.substring(0, 200),
            previousPreview: previousLocaleFormData.substring(0, 200),
        });

        // Only save if the data has actually changed
        if (currentFormDataString !== previousLocaleFormData) {
            console.log("SAVE DEBUG - Data changed, saving...");
            saveTranslations();
            // Update the previous state to prevent unnecessary saves
            previousLocaleFormData = currentFormDataString;
        }
    }

    // Manual save function for testing
    async function saveTranslations() {
        console.log("SAVE DEBUG - saveTranslations called");

        // Initialize translationData structure for this component and locale
        if (!translationData[componentInstance.id]) {
            translationData[componentInstance.id] = {};
        }
        if (!translationData[componentInstance.id][activeLocale]) {
            translationData[componentInstance.id][activeLocale] = {};
        }

        const translations =
            translationData[componentInstance.id][activeLocale];

        // Save regular translatable fields
        regularTranslatableFields.forEach((field) => {
            if (localeFormData[field.name] !== undefined) {
                translations[field.name] = localeFormData[field.name];
                console.log(
                    "SAVE DEBUG - Saved regular field:",
                    field.name,
                    "=",
                    localeFormData[field.name],
                );
            }
        });

        // Save repeater field translations
        repeaterFieldsWithTranslatableContent.forEach((repeaterField) => {
            const repeaterItems = localeFormData[repeaterField.name] || [];
            console.log(
                "SAVE DEBUG - Processing repeater field:",
                repeaterField.name,
                "with items:",
                repeaterItems,
            );

            if (Array.isArray(repeaterItems)) {
                repeaterItems.forEach((item, itemIndex) => {
                    console.log(
                        "SAVE DEBUG - Processing repeater item",
                        itemIndex,
                        ":",
                        item,
                    );

                    const itemKey = `${repeaterField.name}_${itemIndex}`;
                    if (!translations[itemKey]) {
                        translations[itemKey] = {};
                    }

                    const itemTranslation = translations[itemKey];

                    // Save translatable fields from this repeater item
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
                            console.log(
                                "SAVE DEBUG - Saved nested field:",
                                nestedField.name,
                                "=",
                                item[nestedField.name],
                            );
                        }
                    });

                    // Save nested repeater field translations
                    nestedAnalysis.repeaterFields.forEach(
                        (nestedRepeaterField) => {
                            const nestedRepeaterItems =
                                item[nestedRepeaterField.name] || [];
                            console.log(
                                "SAVE DEBUG - Processing nested repeater:",
                                nestedRepeaterField.name,
                                "with items:",
                                nestedRepeaterItems,
                            );

                            if (Array.isArray(nestedRepeaterItems)) {
                                nestedRepeaterItems.forEach(
                                    (nestedItem, nestedItemIndex) => {
                                        console.log(
                                            "SAVE DEBUG - Processing nested item",
                                            nestedItemIndex,
                                            ":",
                                            nestedItem,
                                        );

                                        const nestedItemKey = `${nestedRepeaterField.name}_${nestedItemIndex}`;
                                        if (!itemTranslation[nestedItemKey]) {
                                            itemTranslation[nestedItemKey] = {};
                                        }

                                        const nestedItemTranslation =
                                            itemTranslation[nestedItemKey];

                                        // Save deep translatable fields
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
                                                    console.log(
                                                        "SAVE DEBUG - Saved deep field:",
                                                        deepField.name,
                                                        "=",
                                                        nestedItem[
                                                            deepField.name
                                                        ],
                                                    );
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

        console.log(
            "SAVE DEBUG - Final translationData for component:",
            translationData[componentInstance.id],
        );

        // Now call FormBuilder's save function to persist to backend
        if (formBuilderContext?.saveTranslations) {
            console.log("SAVE DEBUG - Calling FormBuilder save function...");
            await formBuilderContext.saveTranslations();
            console.log("SAVE DEBUG - FormBuilder save completed!");
        } else {
            console.log("SAVE DEBUG - No saveTranslations function in context");
        }
    }
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

        {#if activeLocale !== CMS_LOCALE}
            <button
                type="button"
                on:click={saveTranslations}
                class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
                Save Translations
            </button>
        {/if}
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
