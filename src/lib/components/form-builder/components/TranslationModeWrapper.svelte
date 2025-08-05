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
    } from "../utils/optimizedSchemaProcessor";
    import { CSS_CLASSES, SCHEMA_TYPES } from "../constants";
    import { CMS_LOCALE } from "@/lib/shared/env";

    export let componentInstance: any;
    export let formData: FormData;
    export let translationData: TranslationData = {};
    export let locales: readonly { code: string; name: string }[] = [];

    $: componentAnalysis = getComponentAnalysis(componentInstance.component);
    $: regularTranslatableFields = componentAnalysis.translatableFields;
    $: repeaterFieldsWithTranslatableContent =
        componentAnalysis.repeaterFields.filter(
            (f) =>
                f.schema &&
                componentAnalysis.allFields.some(
                    (af) => af.translatable === true,
                ),
        );
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

    $: {
        if (activeLocale === CMS_LOCALE) {
            localeFormData = formData[componentInstance.id] || {};
        } else {
            const contentData = formData[componentInstance.id] || {};
            const localeTranslationData =
                translationData[componentInstance.id]?.[activeLocale] || {};
            const mergedData = { ...contentData };

            regularTranslatableFields.forEach((field) => {
                if (
                    field.type !== "repeater" &&
                    localeTranslationData[field.name] !== undefined
                ) {
                    mergedData[field.name] = localeTranslationData[field.name];
                }
            });

            repeaterFieldsWithTranslatableContent.forEach((repeaterField) => {
                const repeaterItems = contentData[repeaterField.name] || [];
                if (Array.isArray(repeaterItems)) {
                    const translatedItems = repeaterItems.map(
                        (item, itemIndex) => {
                            const translationKey = `${repeaterField.name}_${itemIndex}`;
                            const itemTranslations =
                                localeTranslationData[translationKey] || {};

                            return { ...item, ...itemTranslations };
                        },
                    );
                    mergedData[repeaterField.name] = translatedItems;
                }
            });

            localeFormData = mergedData;
        }
    }

    $: if (activeLocale !== CMS_LOCALE && localeFormData) {
        if (!translationData[componentInstance.id]) {
            translationData[componentInstance.id] = {};
        }
        if (!translationData[componentInstance.id][activeLocale]) {
            translationData[componentInstance.id][activeLocale] = {};
        }

        const localeTranslationData =
            translationData[componentInstance.id][activeLocale];

        regularTranslatableFields.forEach((field) => {
            if (
                field.type !== "repeater" &&
                localeFormData[field.name] !== undefined
            ) {
                localeTranslationData[field.name] = localeFormData[field.name];
            }
        });

        repeaterFieldsWithTranslatableContent.forEach((repeaterField) => {
            const repeaterItems = localeFormData[repeaterField.name] || [];
            if (Array.isArray(repeaterItems)) {
                repeaterItems.forEach((item, itemIndex) => {
                    const translationKey = `${repeaterField.name}_${itemIndex}`;

                    if (!localeTranslationData[translationKey]) {
                        localeTranslationData[translationKey] = {};
                    }

                    // Get nested translatable fields from the repeater's schema
                    const analysis = getComponentAnalysis({
                        schema: repeaterField.schema || [],
                    });
                    const nestedTranslatableFields =
                        analysis.translatableFields;

                    nestedTranslatableFields.forEach((nestedField) => {
                        if (item[nestedField.name] !== undefined) {
                            localeTranslationData[translationKey][
                                nestedField.name
                            ] = item[nestedField.name];
                        }
                    });
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
