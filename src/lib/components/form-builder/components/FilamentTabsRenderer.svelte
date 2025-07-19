<script lang="ts">
    import type { SchemaItem, FormData, RenderMode } from '../types';
    import { Tabs, TabsContent, TabsList } from '$lib/components/ui/tabs';
    import FormFieldComponent from '../FormField.svelte';
    import GridLayout from '../layouts/GridLayout.svelte';
    import ResponsiveTabTrigger from './ResponsiveTabTrigger.svelte';
    import { isTabsContainer, isFormField, convertToFormField, renderSchemaItem, filterSchemaByMode } from '../utils/formHelpers';
    import { CSS_CLASSES, SCHEMA_TYPES } from '../constants';
    
    export let schema: SchemaItem[];
    export let componentId: string;
    export let formData: Record<string, any>;
    export let mode: RenderMode = RenderMode.CONTENT;
    
    $: filteredSchema = filterSchemaByMode(schema, mode);
</script>

<div class="space-y-6">
    {#each filteredSchema as item, index (isTabsContainer(item) ? item.name : isFormField(item) ? convertToFormField(item)?.name || `item-${index}` : `item-${index}`)}
        {#if isTabsContainer(item)}
            {@const tabsContainer = item}
            {@const defaultTab = tabsContainer.activeTab || tabsContainer.tabs[0]?.name || ''}
            
            <Tabs value={defaultTab} class={CSS_CLASSES.TABS_CONTAINER}>
                <TabsList class={CSS_CLASSES.TABS_LIST} style="grid-template-columns: repeat({tabsContainer.tabs.length}, minmax(0, 1fr));">
                    {#each tabsContainer.tabs as tab (tab.name)}
                        <ResponsiveTabTrigger {tab} value={tab.name} />
                    {/each}
                </TabsList>

                {#each tabsContainer.tabs as tab (tab.name)}
                    <TabsContent value={tab.name} class={CSS_CLASSES.TABS_CONTENT}>
                        <div class="space-y-6">
                            {#each filterSchemaByMode(tab.schema, mode) as schemaItem}
                                {@const renderedItem = renderSchemaItem(schemaItem, componentId)}
                                {#if renderedItem}
                                    {#if renderedItem.type === 'field'}
                                        <FormFieldComponent 
                                            field={renderedItem.field}
                                            fieldId="{componentId}-{renderedItem.field.name}"
                                            bind:value={formData[renderedItem.field.name]}
                                        />
                                    {:else if renderedItem.type === 'grid'}
                                        <GridLayout 
                                            layout={renderedItem.layout}
                                            {formData}
                                            {componentId}
                                            {mode}
                                        />
                                    {/if}
                                {/if}
                            {/each}
                        </div>
                    </TabsContent>
                {/each}
            </Tabs>
        {:else if isFormField(item)}
            {@const field = convertToFormField(item)}
            {#if field}
                <FormFieldComponent 
                    {field}
                    fieldId="{componentId}-{field.name}"
                    bind:value={formData[field.name]}
                />
            {/if}
        {:else if item && typeof item === 'object' && 'type' in item && item.type === SCHEMA_TYPES.GRID}
            <GridLayout 
                layout={item}
                {formData}
                {componentId}
                {mode}
            />
        {/if}
    {/each}
</div> 