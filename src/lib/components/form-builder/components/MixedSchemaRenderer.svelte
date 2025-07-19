<script lang="ts">
    import type { SchemaItem, ComponentTab, FormField, TranslationData } from '../types';
    import { RenderMode } from '../types';
    import { Tabs, TabsContent, TabsList } from '$lib/components/ui/tabs';
    import FormFieldComponent from '../FormField.svelte';
    import GridLayout from '../layouts/GridLayout.svelte';
    import ResponsiveTabTrigger from './ResponsiveTabTrigger.svelte';
    import { getAllFields, groupFieldsByTab, isFormField, convertToFormField, filterFieldsByMode, filterSchemaByMode } from '../utils/formHelpers';
    import { CSS_CLASSES, SCHEMA_TYPES } from '../constants';
    
    export let schema: SchemaItem[];
    export let tabs: ComponentTab[];
    export let activeTab: string;
    export let componentId: string;
    export let formData: Record<string, any>;
    export let mode: RenderMode = RenderMode.CONTENT;
    export let currentLocale: string = '';
    export let isDefaultLocale: boolean = true;
    export let translationData: TranslationData = {};
    
    $: allFields = getAllFields(schema);
    $: filteredFields = filterFieldsByMode(allFields, mode);
    $: groupedFields = groupFieldsByTab(filteredFields, tabs, schema);
    $: filteredSchema = filterSchemaByMode(schema, mode);
</script>

<div class="space-y-6">
    {#each filteredSchema as item, index (item.type === 'tabs-selector' ? item.id : isFormField(item) ? item.name : `item-${index}`)}
        {#if item.type === SCHEMA_TYPES.TABS_SELECTOR}
            {#if tabs.length > 0}
                <Tabs value={activeTab} class={CSS_CLASSES.TABS_CONTAINER}>
                    <TabsList class="grid w-full overflow-hidden" style="grid-template-columns: repeat({tabs.length}, minmax(0, 1fr));">
                        {#each tabs as tab (tab.name)}
                            <ResponsiveTabTrigger {tab} value={tab.name} />
                        {/each}
                    </TabsList>

                    {#each tabs as tab (tab.name)}
                        <TabsContent value={tab.name} class="mt-6">
                            <div class="space-y-6">
                                {#each groupedFields[tab.name] || [] as field (field.name)}
                                    <FormFieldComponent 
                                        {field}
                                        fieldId="{componentId}-{field.name}"
                                        bind:value={formData[field.name]}
                                    />
                                {/each}
                                
                                {#each filteredSchema as item, index}
                                    {#if item.type === SCHEMA_TYPES.GRID}
                                        <GridLayout 
                                            layout={item}
                                            {formData}
                                            {componentId}
                                            activeTab={tab.name}
                                            {mode}
                                            {currentLocale}
                                            {isDefaultLocale}
                                            {translationData}
                                        />
                                    {/if}
                                {/each}
                            </div>
                        </TabsContent>
                    {/each}
                </Tabs>
            {/if}
        {:else if item.type === SCHEMA_TYPES.GRID && item.schema && item.schema.some((field: any) => !field.tab)}
            <GridLayout 
                layout={item}
                {formData}
                {componentId}
                activeTab={undefined}
                {mode}
                {currentLocale}
                {isDefaultLocale}
                {translationData}
            />
        {:else if isFormField(item)}
            {@const field = convertToFormField(item)}
            {#if field}
                <FormFieldComponent 
                    {field}
                    fieldId="{componentId}-{field.name}"
                    bind:value={formData[field.name]}
                />
            {/if}
        {/if}
    {/each}
</div> 