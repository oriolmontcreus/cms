<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import type { Component } from '@shared/types/pages.type';
    import FormFieldComponent from './FormField.svelte';
    import GridLayout from './layouts/GridLayout.svelte';
    import TabsLayout from './layouts/TabsLayout.svelte';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
    import type { FormField, Layout, ComponentTab } from './types';

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];

    let formData: FormData = {};

    function getAllFields(schema: Layout | FormField[]): FormField[] {
        if (Array.isArray(schema)) return schema;
        if (schema.type === 'grid')  return schema.schema;
        if (schema.type === 'tabs') return schema.tabs.flatMap(tab => tab.schema);
        return [];
    }

    function usesTabUtility(component: any): boolean {
        if (!Array.isArray(component.schema)) return false;
        return component.tabs && component.tabs.length > 0;
    }

    function groupFieldsByTab(fields: FormField[], tabs: ComponentTab[]): Record<string, FormField[]> {
        const grouped: Record<string, FormField[]> = {};

        tabs.forEach(tab => {
            grouped[tab.name] = [];
        });
        
        fields.forEach(field => {
            const tabName = field.tab || tabs[0]?.name || 'default';
            if (!grouped[tabName]) grouped[tabName] = [];
            grouped[tabName].push(field);
        });
        return grouped;
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
        <div class="space-y-6 p-6 border rounded-lg">
            <h3 class="text-lg font-semibold">
                {componentInstance.displayName || componentInstance.component.name}
            </h3>
            
            {#if usesTabUtility(componentInstance.component)}
                <!-- New tab utility approach -->
                {@const fields = Array.isArray(componentInstance.component.schema) ? componentInstance.component.schema : []}
                {@const tabs = componentInstance.component.tabs || []}
                {@const groupedFields = groupFieldsByTab(fields, tabs)}
                {@const defaultTab = componentInstance.component.activeTab || tabs[0]?.name || ''}
                
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
                                        {field}
                                        fieldId="{componentInstance.id}-{field.name}"
                                        bind:value={formData[componentInstance.id][field.name]}
                                    />
                                {/each}
                            </div>
                        </TabsContent>
                    {/each}
                </Tabs>
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
                    {#each componentInstance.component.schema as field (field.name)}
                        <FormFieldComponent 
                            {field}
                            fieldId="{componentInstance.id}-{field.name}"
                            bind:value={formData[componentInstance.id][field.name]}
                        />
                    {/each}
                </div>
            {/if}
        </div>
    {/each}

    <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
    </Button>
</form> 