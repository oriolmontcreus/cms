<script lang="ts">
    import type { TabsLayout } from '../types';
    import FormFieldComponent from '../FormField.svelte';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';

    export let layout: TabsLayout;
    export let formData: Record<string, any>;
    export let componentId: string;
    export let formBuilderContext: any;

    // Get the default tab (either specified activeTab or first tab)
    $: defaultTab = layout.activeTab !== undefined 
        ? layout.tabs[layout.activeTab]?.id || layout.tabs[0]?.id || ''
        : layout.tabs[0]?.id || '';
</script>

<Tabs value={defaultTab} class="w-full">
    <TabsList class="grid w-full" style="grid-template-columns: repeat({layout.tabs.length}, minmax(0, 1fr));">
        {#each layout.tabs as tab (tab.id)}
            <TabsTrigger value={tab.id} class="flex items-center gap-2">
                {#if tab.icon}
                    <svelte:component this={tab.icon} size={16} />
                {/if}
                {tab.label}
            </TabsTrigger>
        {/each}
    </TabsList>

    {#each layout.tabs as tab (tab.id)}
        <TabsContent value={tab.id} class="mt-6">
            <div class="space-y-6">
                {#each tab.schema as field (field.name)}
                    <FormFieldComponent 
                        {field}
                        fieldId="{componentId}-{field.name}"
                        bind:value={formData[field.name]}
                        {formBuilderContext}
                    />
                {/each}
            </div>
        </TabsContent>
    {/each}
</Tabs> 