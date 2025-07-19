<script lang="ts">
    import type { SchemaItem, FormData, TranslationData, TabsContainer, FormField } from '../types';
    import { RenderMode } from '../types';
    import { Tabs, TabsContent, TabsList } from '$lib/components/ui/tabs';
    import FormFieldComponent from '../FormField.svelte';
    import GridLayout from '../layouts/GridLayout.svelte';
    import ResponsiveTabTrigger from './ResponsiveTabTrigger.svelte';
    import { filterSchemaByModeOptimized } from '../utils/optimizedSchemaProcessor';
    import { convertToFormField } from '../utils/formHelpers';
    import { CSS_CLASSES, SCHEMA_TYPES } from '../constants';

    export let schema: SchemaItem[];
    export let componentId: string;
    export let formData: Record<string, any>;
    export let mode: RenderMode = RenderMode.CONTENT;
    export let currentLocale: string = '';
    export let isDefaultLocale: boolean = true;
    export let translationData: TranslationData = {};

    // Optimized schema filtering
    $: filteredSchema = filterSchemaByModeOptimized(schema, mode);

    // Helper functions for type checking - more efficient than repeated checks
    function isFormField(item: any): boolean {
        return convertToFormField(item) !== null;
    }

    function isGrid(item: any): boolean {
        return item && typeof item === 'object' && item.type === SCHEMA_TYPES.GRID;
    }

    function isTabsContainer(item: any): boolean {
        return item && typeof item === 'object' && item.type === SCHEMA_TYPES.TABS_CONTAINER;
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

    // Render field component optimized
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
            compact: mode === RenderMode.TRANSLATION
        };
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
            <GridLayout
                layout={item}
                {formData}
                {componentId}
                {mode}
                {currentLocale}
                {isDefaultLocale}
                {translationData}
            />
        {:else if isTabsContainer(item)}
            {@const tabsContainer = item as TabsContainer}
            {@const defaultTab = tabsContainer.activeTab || tabsContainer.tabs[0]?.name || ''}
            
            <Tabs value={defaultTab} class={CSS_CLASSES.TABS_CONTAINER}>
                <TabsList class={CSS_CLASSES.TABS_LIST} style="grid-template-columns: repeat({tabsContainer.tabs.length}, minmax(0, 1fr));">
                    {#each tabsContainer.tabs as tab (tab.name)}
                        <ResponsiveTabTrigger {tab} value={tab.name} />
                    {/each}
                </TabsList>

                {#each tabsContainer.tabs as tab (tab.name)}
                    <TabsContent value={tab.name} class={CSS_CLASSES.TABS_CONTENT}>
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
        {/if}
    {/each}
</div>