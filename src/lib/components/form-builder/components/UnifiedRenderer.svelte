<script lang="ts">
    import type {
        SchemaItem,
        FormData,
        TranslationData,
        TabsContainer,
        FormField,
        GridLayout as GridLayoutType,
    } from "../types";
    import { RenderMode } from "../types";
    import { Tabs, TabsContent, TabsList } from "$lib/components/ui/tabs";
    import FormFieldComponent from "../FormField.svelte";
    import GridLayoutComponent from "../layouts/GridLayout.svelte";
    import ResponsiveTabTrigger from "./ResponsiveTabTrigger.svelte";
    import { filterSchemaByModeOptimized } from "../utils/optimizedSchemaProcessor";
    import { convertToFormField } from "../utils/formHelpers";
    import { CSS_CLASSES, SCHEMA_TYPES } from "../constants";

    export let schema: SchemaItem[];
    export let componentId: string;
    export let formData: Record<string, any>;
    export let mode: RenderMode = RenderMode.CONTENT;
    export let currentLocale: string = "";
    export let isDefaultLocale: boolean = true;
    export let translationData: TranslationData = {};

    $: filteredSchema = filterSchemaByModeOptimized(schema, mode);

    function isFormField(item: any): boolean {
        const field = convertToFormField(item);
        return field !== null && !field.hidden;
    }

    function isGrid(item: any): boolean {
        return (
            item &&
            typeof item === "object" &&
            item.type === SCHEMA_TYPES.GRID &&
            !item.hidden
        );
    }

    function isTabsContainer(item: any): boolean {
        return (
            item &&
            typeof item === "object" &&
            item.type === SCHEMA_TYPES.TABS_CONTAINER &&
            !item.hidden
        );
    }

    function getUniqueKey(item: any, index: number): string {
        if (isFormField(item)) {
            const field = convertToFormField(item);
            return field?.name || `field-${index}`;
        }
        if (isTabsContainer(item)) {
            return item.name || `tabs-${index}`;
        }
        if (isGrid(item)) {
            return `grid-${index}`;
        }
        return `item-${index}`;
    }

    function renderField(field: FormField) {
        return {
            field,
            fieldId: `${componentId}-${field.name}`,
            value: formData[field.name],
            isTranslationMode: mode === RenderMode.TRANSLATION,
            currentLocale,
            isDefaultLocale,
            translationData,
            componentId,
            compact: mode === RenderMode.TRANSLATION,
        };
    }

    function hasTranslatableContent(item: any): boolean {
        if (!item || typeof item !== "object") return false;

        // Handle containers
        if ("type" in item) {
            if (
                item.type === SCHEMA_TYPES.GRID &&
                "schema" in item &&
                !item.hidden
            ) {
                return (item.schema as FormField[]).some(
                    (f) =>
                        !f.hidden &&
                        (f.translatable === true ||
                            (f.type === "repeater" &&
                                f.schema &&
                                hasTranslatableFieldsInSchema(f.schema))),
                );
            }

            if (
                item.type === SCHEMA_TYPES.TABS_CONTAINER &&
                "tabs" in item &&
                !item.hidden
            ) {
                return (item as TabsContainer).tabs.some(
                    (tab) =>
                        !tab.hidden &&
                        tab.schema.some((schemaItem) =>
                            hasTranslatableContent(schemaItem),
                        ),
                );
            }
        }

        // Handle individual fields
        const field = convertToFormField(item);
        if (field && !field.hidden) {
            if (field.translatable === true) return true;

            if (field.type === "repeater" && field.schema) {
                return hasTranslatableFieldsInSchema(field.schema);
            }
        }

        return false;
    }

    function hasTranslatableFieldsInSchema(schema: any[]): boolean {
        return schema.some((item) => {
            const field = convertToFormField(item);
            return field?.translatable === true;
        });
    }
</script>

<div class="space-y-6">
    {#each filteredSchema as item, index (getUniqueKey(item, index))}
        {#if isFormField(item)}
            {@const field = convertToFormField(item)}
            {#if field}
                {@const props = renderField(field)}
                <FormFieldComponent
                    field={props.field}
                    fieldId={props.fieldId}
                    bind:value={formData[field.name]}
                    isTranslationMode={props.isTranslationMode}
                    currentLocale={props.currentLocale}
                    isDefaultLocale={props.isDefaultLocale}
                    translationData={props.translationData}
                    componentId={props.componentId}
                    compact={props.compact}
                />
            {/if}
        {:else if isGrid(item)}
            <GridLayoutComponent
                layout={item as GridLayoutType}
                {formData}
                {componentId}
                {mode}
                {currentLocale}
                {isDefaultLocale}
                {translationData}
            />
        {:else if isTabsContainer(item)}
            {@const tabsContainer = item as TabsContainer}
            {@const visibleTabs = tabsContainer.tabs.filter(
                (tab) => !tab.hidden,
            )}
            {@const filteredTabs =
                mode === RenderMode.TRANSLATION
                    ? visibleTabs.filter((tab) =>
                          tab.schema.some((schemaItem) =>
                              hasTranslatableContent(schemaItem),
                          ),
                      )
                    : visibleTabs}

            {#if filteredTabs.length > 0}
                {@const defaultTab =
                    filteredTabs.find(
                        (tab) => tab.name === tabsContainer.activeTab,
                    )?.name ||
                    filteredTabs[0]?.name ||
                    ""}

                <Tabs value={defaultTab} class={CSS_CLASSES.TABS_CONTAINER}>
                    <TabsList
                        class={CSS_CLASSES.TABS_LIST}
                        style="grid-template-columns: repeat({filteredTabs.length}, minmax(0, 1fr));"
                    >
                        {#each filteredTabs as tab (tab.name)}
                            <ResponsiveTabTrigger {tab} value={tab.name} />
                        {/each}
                    </TabsList>

                    {#each filteredTabs as tab (tab.name)}
                        <TabsContent
                            value={tab.name}
                            class={CSS_CLASSES.TABS_CONTENT}
                        >
                            <svelte:self
                                schema={tab.schema}
                                {componentId}
                                {formData}
                                {mode}
                                {currentLocale}
                                {isDefaultLocale}
                                {translationData}
                            />
                        </TabsContent>
                    {/each}
                </Tabs>
            {:else if mode === RenderMode.TRANSLATION}
                <div
                    class="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/10"
                >
                    This section has no translatable fields.
                </div>
            {/if}
        {/if}
    {/each}
</div>
