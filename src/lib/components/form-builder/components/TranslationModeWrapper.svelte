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

    export let componentInstance: any;
    export let formData: FormData;
    export let translationData: TranslationData = {};
    export let locales: readonly { code: string; name: string }[] = [];

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

    // Simple approach: just work with the existing translation structure
    $: {
        const contentData = formData[componentInstance.id] || {};
        const isDefaultLocale = activeLocale === CMS_LOCALE;

        if (isDefaultLocale) {
            localeFormData = contentData;
        } else {
            // Get translations from the legacy format
            const translations = contentData.translations?.[activeLocale] || {};
            const mergedData = { ...contentData };

            // Apply translations for regular translatable fields
            regularTranslatableFields.forEach((field) => {
                if (translations[field.name] !== undefined) {
                    mergedData[field.name] = translations[field.name];
                } else {
                    mergedData[field.name] = getFieldDefaultValue(field);
                }
            });

            // Apply translations for repeater fields
            repeaterFieldsWithTranslatableContent.forEach((repeaterField) => {
                const repeaterItems = contentData[repeaterField.name] || [];
                if (Array.isArray(repeaterItems)) {
                    const translatedItems = repeaterItems.map(
                        (item, itemIndex) => {
                            const itemTranslation =
                                translations[repeaterField.name]?.[itemIndex] ||
                                {};
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
                                                    const nestedItemTranslation =
                                                        itemTranslation[
                                                            nestedRepeaterField
                                                                .name
                                                        ]?.[nestedItemIndex] ||
                                                        {};
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
    }

    // Save translations back to the legacy format when form data changes
    $: if (activeLocale !== CMS_LOCALE && localeFormData) {
        const contentData = formData[componentInstance.id] || {};

        if (!contentData.translations) {
            contentData.translations = {};
        }
        if (!contentData.translations[activeLocale]) {
            contentData.translations[activeLocale] = {};
        }

        const translations = contentData.translations[activeLocale];

        // Save regular translatable fields
        regularTranslatableFields.forEach((field) => {
            if (localeFormData[field.name] !== undefined) {
                translations[field.name] = localeFormData[field.name];
            }
        });

        // Save repeater field translations
        repeaterFieldsWithTranslatableContent.forEach((repeaterField) => {
            const repeaterItems = localeFormData[repeaterField.name] || [];
            if (Array.isArray(repeaterItems)) {
                if (!translations[repeaterField.name]) {
                    translations[repeaterField.name] = [];
                }

                repeaterItems.forEach((item, itemIndex) => {
                    if (!translations[repeaterField.name][itemIndex]) {
                        translations[repeaterField.name][itemIndex] = {};
                    }

                    const itemTranslation =
                        translations[repeaterField.name][itemIndex];

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
                        }
                    });

                    // Save nested repeater field translations
                    nestedAnalysis.repeaterFields.forEach(
                        (nestedRepeaterField) => {
                            const nestedRepeaterItems =
                                item[nestedRepeaterField.name] || [];
                            if (Array.isArray(nestedRepeaterItems)) {
                                if (
                                    !itemTranslation[nestedRepeaterField.name]
                                ) {
                                    itemTranslation[nestedRepeaterField.name] =
                                        [];
                                }

                                nestedRepeaterItems.forEach(
                                    (nestedItem, nestedItemIndex) => {
                                        if (
                                            !itemTranslation[
                                                nestedRepeaterField.name
                                            ][nestedItemIndex]
                                        ) {
                                            itemTranslation[
                                                nestedRepeaterField.name
                                            ][nestedItemIndex] = {};
                                        }

                                        const nestedItemTranslation =
                                            itemTranslation[
                                                nestedRepeaterField.name
                                            ][nestedItemIndex];

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
</script>

{#if hasTranslatableContent}
    <div class="mb-4">
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
