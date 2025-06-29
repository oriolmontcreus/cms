<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import type { Component } from '@shared/types/pages.type';
    import FormFieldComponent from './FormField.svelte';
    import GridLayout from './layouts/GridLayout.svelte';
    import TabsLayout from './layouts/TabsLayout.svelte';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
    import type { FormField, Layout, ComponentTab, SchemaItem, TabsContainer } from './types';

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];

    let formData: FormData = {};

    // Helper function to convert FieldBuilder instances to FormField objects
    function convertToFormField(item: any): FormField | null {
        if (item && typeof item === 'object' && 'toJSON' in item && typeof item.toJSON === 'function') {
            return item.toJSON();
        }
        if (item && 'name' in item && 'type' in item) {
            return item as FormField;
        }
        return null;
    }

    function getAllFields(schema: Layout | SchemaItem[]): FormField[] {
        if (Array.isArray(schema)) {
            return schema
                .flatMap(item => {
                    if (item && typeof item === 'object' && 'type' in item) {
                        if (item.type === 'grid') {
                            return item.schema || [];
                        }
                        if (item.type === 'tabs-container') {
                            return (item as TabsContainer).tabs.flatMap(tab => 
                                getAllFields(tab.schema)
                            );
                        }
                    }
                    return convertToFormField(item);
                })
                .filter((item): item is FormField => item !== null);
        }
        if (schema.type === 'grid') return schema.schema;
        if (schema.type === 'tabs') return schema.tabs.flatMap(tab => tab.schema);
        return [];
    }

    function usesTabUtility(component: any): boolean {
        if (!Array.isArray(component.schema)) return false;
        return component.tabs && component.tabs.length > 0;
    }

    function usesMixedSchema(component: any): boolean {
        if (!Array.isArray(component.schema)) return false;
        return component.schema.some((item: any) => item.type === 'tabs-selector');
    }

    function usesFilamentTabs(component: any): boolean {
        if (!Array.isArray(component.schema)) return false;
        return component.schema.some((item: any) => item.type === 'tabs-container');
    }

    function isFormField(item: SchemaItem): item is FormField {
        return convertToFormField(item) !== null;
    }

    function isTabsContainer(item: SchemaItem): item is TabsContainer {
        return item && typeof item === 'object' && 'type' in item && item.type === 'tabs-container';
    }

    function groupFieldsByTab(fields: FormField[], tabs: ComponentTab[], schema: any[]): Record<string, FormField[]> {
        const tabFields: Record<string, FormField[]> = {};

        tabs.forEach(tab => {
            tabFields[tab.name] = [];
        });
        
        // Get field names that are inside grids to exclude them
        const fieldsInGrids = new Set<string>();
        if (Array.isArray(schema)) {
            schema.forEach(item => {
                if (item && typeof item === 'object' && 'type' in item && item.type === 'grid' && item.schema) {
                    item.schema.forEach((field: any) => {
                        if (field && field.name) {
                            fieldsInGrids.add(field.name);
                        }
                    });
                }
            });
        }
        
        fields.forEach(field => {
            // Only add fields that are NOT in grids (grids will handle their own fields)
            if (field.tab && tabFields[field.tab] && !fieldsInGrids.has(field.name)) {
                tabFields[field.tab].push(field);
            }
        });
        
        return tabFields;
    }

    // Helper function to check if a grid has non-tabbed fields
    function gridHasNonTabbedFields(grid: any): boolean {
        if (!grid || grid.type !== 'grid' || !grid.schema) return false;
        return grid.schema.some((field: any) => !field.tab);
    }

    // Helper function to render schema items recursively
    function renderSchemaItem(item: SchemaItem, componentId: string, activeTab?: string) {
        if (isFormField(item)) {
            const field = convertToFormField(item);
            if (field) {
                return {
                    type: 'field' as const,
                    field,
                    componentId
                };
            }
        } else if (item && typeof item === 'object' && 'type' in item) {
            if (item.type === 'grid') {
                return {
                    type: 'grid' as const,
                    layout: item,
                    componentId,
                    activeTab
                };
            }
        }
        return null;
    }
    
    config.components.forEach(componentInstance => {
        formData[componentInstance.id] = {};
        const existingComponent = components.find(c => c.instanceId === componentInstance.id);
        
        const allFields = getAllFields(componentInstance.component.schema);
        
        allFields.forEach(field => {
            const existingValue = existingComponent?.formData[field.name];
            if (existingValue !== undefined) {
                formData[componentInstance.id][field.name] = existingValue;
            } else {
                formData[componentInstance.id][field.name] = field.type === 'number' ? null :
                    field.type === 'select' && field.multiple ? [] :
                    field.type === 'toggle' ? false :
                    field.type === 'dateRange' ? { start: '', end: '' } :
                    field.type === 'color' ? '#000000' :
                    field.type === 'richtext' ? '' : '';
            }
        });
    });

    let isSubmitting = false;

    async function handleSubmit() {
        try {
            isSubmitting = true;
            
            const updatedComponents: Component[] = config.components.map(componentInstance => ({
                componentName: componentInstance.component.name,
                instanceId: componentInstance.id,
                displayName: componentInstance.displayName || componentInstance.component.name,
                formData: formData[componentInstance.id] || {}
            }));
            
            await handleUpdateComponents(slug, updatedComponents);
        } catch (error) {
            console.error('Error saving components:', error);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<form class="space-y-8" on:submit|preventDefault={handleSubmit}>
    {#each config.components as componentInstance (componentInstance.id)}
        <div class="space-y-6 p-6 border rounded-lg bg-card/50 dark:bg-card/20">
            <h3 class="text-lg font-semibold">
                {componentInstance.displayName || componentInstance.component.name}
            </h3>
            
            {#if usesFilamentTabs(componentInstance.component)}
                <!-- New Filament V3 style tabs rendering -->
                {@const schema = Array.isArray(componentInstance.component.schema) ? componentInstance.component.schema : []}
                
                <div class="space-y-6">
                    {#each schema as item, index (isTabsContainer(item) ? item.name : isFormField(item) ? convertToFormField(item)?.name || `item-${index}` : `item-${index}`)}
                        {#if isTabsContainer(item)}
                            {@const tabsContainer = item}
                            {@const defaultTab = tabsContainer.activeTab || tabsContainer.tabs[0]?.name || ''}
                            
                            <Tabs value={defaultTab} class="w-full">
                                <TabsList class="grid w-full" style="grid-template-columns: repeat({tabsContainer.tabs.length}, minmax(0, 1fr));">
                                    {#each tabsContainer.tabs as tab (tab.name)}
                                        <TabsTrigger value={tab.name} class="flex items-center gap-2">
                                            {#if tab.icon}
                                                <svelte:component this={tab.icon} size={16} />
                                            {/if}
                                            {tab.label}
                                        </TabsTrigger>
                                    {/each}
                                </TabsList>

                                {#each tabsContainer.tabs as tab (tab.name)}
                                    <TabsContent value={tab.name} class="mt-6">
                                        <div class="space-y-6">
                                            {#each tab.schema as schemaItem}
                                                {@const renderedItem = renderSchemaItem(schemaItem, componentInstance.id)}
                                                {#if renderedItem}
                                                    {#if renderedItem.type === 'field'}
                                                        <FormFieldComponent 
                                                            field={renderedItem.field}
                                                            fieldId="{componentInstance.id}-{renderedItem.field.name}"
                                                            bind:value={formData[componentInstance.id][renderedItem.field.name]}
                                                        />
                                                    {:else if renderedItem.type === 'grid'}
                                                        <GridLayout 
                                                            layout={renderedItem.layout}
                                                            formData={formData[componentInstance.id]}
                                                            componentId={componentInstance.id}
                                                        />
                                                    {/if}
                                                {/if}
                                            {/each}
                                        </div>
                                    </TabsContent>
                                {/each}
                            </Tabs>
                        {:else if isFormField(item)}
                            <!-- Render regular field -->
                            {@const field = convertToFormField(item)}
                            {#if field}
                                <FormFieldComponent 
                                    field={field}
                                    fieldId="{componentInstance.id}-{field.name}"
                                    bind:value={formData[componentInstance.id][field.name]}
                                />
                            {/if}
                        {:else if item && typeof item === 'object' && 'type' in item && item.type === 'grid'}
                            <!-- Render grid layout -->
                            <GridLayout 
                                layout={item}
                                formData={formData[componentInstance.id]}
                                componentId={componentInstance.id}
                            />
                        {/if}
                    {/each}
                </div>
            {:else if usesMixedSchema(componentInstance.component)}
                <!-- Existing mixed schema approach -->
                {@const schema = Array.isArray(componentInstance.component.schema) ? componentInstance.component.schema : []}
                {@const tabs = componentInstance.component.tabs || []}
                {@const allFields = getAllFields(componentInstance.component.schema)}
                {@const groupedFields = groupFieldsByTab(allFields, tabs, schema)}
                {@const defaultTab = componentInstance.component.activeTab || tabs[0]?.name || ''}
                
                <div class="space-y-6">
                    {#each schema as item, index (item.type === 'tabs-selector' ? item.id : isFormField(item) ? item.name : `item-${index}`)}
                        {#if item.type === 'tabs-selector'}
                            <!-- Render tabs at this position -->
                            {#if tabs.length > 0}
                                <Tabs value={defaultTab} class="w-full">
                                    <TabsList class="grid w-full" style="grid-template-columns: repeat({tabs.length}, minmax(0, 1fr));">
                                        {#each tabs as tab (tab.name)}
                                            <TabsTrigger value={tab.name} class="flex items-center gap-2">
                                                {#if tab.icon}
                                                    <svelte:component this={tab.icon} size={16} />
                                                {/if}
                                                {tab.label}
                                            </TabsTrigger>
                                        {/each}
                                    </TabsList>

                                    {#each tabs as tab (tab.name)}
                                        <TabsContent value={tab.name} class="mt-6">
                                            <div class="space-y-6">
                                                {#each groupedFields[tab.name] || [] as field (field.name)}
                                                    <FormFieldComponent 
                                                        field={field}
                                                        fieldId="{componentInstance.id}-{field.name}"
                                                        bind:value={formData[componentInstance.id][field.name]}
                                                    />
                                                {/each}
                                                
                                                <!-- Render grids that have fields for this tab -->
                                                {#each schema as item, index}
                                                    {#if item.type === 'grid'}
                                                        <GridLayout 
                                                            layout={item}
                                                            formData={formData[componentInstance.id]}
                                                            componentId={componentInstance.id}
                                                            activeTab={tab.name}
                                                        />
                                                    {/if}
                                                {/each}
                                            </div>
                                        </TabsContent>
                                    {/each}
                                </Tabs>
                            {/if}
                        {:else if item.type === 'grid' && gridHasNonTabbedFields(item)}
                            <!-- Render grid layout at this position (only for non-tabbed fields) -->
                            <GridLayout 
                                layout={item}
                                formData={formData[componentInstance.id]}
                                componentId={componentInstance.id}
                                activeTab={undefined}
                            />
                        {:else if isFormField(item) && !convertToFormField(item)?.tab}
                            <!-- Render regular field (only if not assigned to a tab) -->
                            {@const field = convertToFormField(item)}
                            {#if field}
                                <FormFieldComponent 
                                    field={field}
                                    fieldId="{componentInstance.id}-{field.name}"
                                    bind:value={formData[componentInstance.id][field.name]}
                                />
                            {/if}
                        {/if}
                    {/each}
                </div>
            {:else if usesTabUtility(componentInstance.component)}
                <!-- Legacy tab utility approach (persistent fields at top) -->
                {@const fields = Array.isArray(componentInstance.component.schema) ? componentInstance.component.schema.map(item => convertToFormField(item)).filter((item): item is FormField => item !== null) : []}
                {@const tabs = componentInstance.component.tabs || []}
                {@const groupedFields = groupFieldsByTab(fields, tabs, Array.isArray(componentInstance.component.schema) ? componentInstance.component.schema : [])}
                {@const persistentFields = fields.filter(f => !f.tab)}
                {@const defaultTab = componentInstance.component.activeTab || tabs[0]?.name || ''}
                
                <!-- Persistent fields (always visible) -->
                {#if persistentFields.length > 0}
                    <div class="space-y-6 mb-6">
                        {#each persistentFields as field (field.name)}
                            <FormFieldComponent 
                                field={field}
                                fieldId="{componentInstance.id}-{field.name}"
                                bind:value={formData[componentInstance.id][field.name]}
                            />
                        {/each}
                    </div>
                {/if}
                
                <!-- Tabbed fields -->
                {#if tabs.length > 0}
                    <Tabs value={defaultTab} class="w-full">
                        <TabsList class="grid w-full" style="grid-template-columns: repeat({tabs.length}, minmax(0, 1fr));">
                            {#each tabs as tab (tab.name)}
                                <TabsTrigger value={tab.name} class="flex items-center gap-2">
                                    {#if tab.icon}
                                        <svelte:component this={tab.icon} size={16} />
                                    {/if}
                                    {tab.label}
                                </TabsTrigger>
                            {/each}
                        </TabsList>

                        {#each tabs as tab (tab.name)}
                            <TabsContent value={tab.name} class="mt-6">
                                <div class="space-y-6">
                                    {#each groupedFields[tab.name] || [] as field (field.name)}
                                        <FormFieldComponent 
                                            field={field}
                                            fieldId="{componentInstance.id}-{field.name}"
                                            bind:value={formData[componentInstance.id][field.name]}
                                        />
                                    {/each}
                                    
                                    <!-- Render grids that have fields for this tab -->
                                    {#if Array.isArray(componentInstance.component.schema)}
                                        {#each componentInstance.component.schema as item, index}
                                            {#if item.type === 'grid'}
                                                <GridLayout 
                                                    layout={item}
                                                    formData={formData[componentInstance.id]}
                                                    componentId={componentInstance.id}
                                                    activeTab={tab.name}
                                                />
                                            {/if}
                                        {/each}
                                    {/if}
                                </div>
                            </TabsContent>
                        {/each}
                    </Tabs>
                {/if}
            {:else if !Array.isArray(componentInstance.component.schema)}
                <!-- Layout-based rendering (existing wrapper approach) -->
                {#if componentInstance.component.schema.type === 'grid'}
                    <GridLayout 
                        layout={componentInstance.component.schema}
                        formData={formData[componentInstance.id]}
                        componentId={componentInstance.id}
                    />
                {:else if componentInstance.component.schema.type === 'tabs'}
                    <TabsLayout 
                        layout={componentInstance.component.schema}
                        formData={formData[componentInstance.id]}
                        componentId={componentInstance.id}
                    />
                {/if}
            {:else}
                <!-- Default layout: vertical stack for field arrays -->
                <div class="flex flex-col gap-8">
                    {#each componentInstance.component.schema as item (isFormField(item) ? convertToFormField(item)?.name || `item-${Math.random()}` : `item-${Math.random()}`)}
                        {#if isFormField(item)}
                            {@const field = convertToFormField(item)}
                            {#if field}
                                <FormFieldComponent 
                                    field={field}
                                    fieldId="{componentInstance.id}-{field.name}"
                                    bind:value={formData[componentInstance.id][field.name]}
                                />
                            {/if}
                        {/if}
                    {/each}
                </div>
            {/if}
        </div>
    {/each}

    <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
    </Button>
</form> 