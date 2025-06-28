<script lang="ts">
    import type { GridLayout } from '../types';
    import FormFieldComponent from '../FormField.svelte';
    import { cn } from '$lib/utils';

    export let layout: GridLayout;
    export let formData: Record<string, any>;
    export let componentId: string;
    export let activeTab: string | undefined = undefined;

    const columns = layout.columns || 2;
    const gap = layout.gap || 4;
    const responsive = layout.responsive;

    $: filteredFields = activeTab 
        ? layout.schema.filter(field => field.tab === activeTab)
        : layout.schema.filter(field => !field.tab);

    $: gridClasses = cn(
        'grid',
        `grid-cols-1`,
        responsive?.sm && `sm:grid-cols-${responsive.sm}`,
        responsive?.md && `md:grid-cols-${responsive.md}`,
        responsive?.lg && `lg:grid-cols-${responsive.lg}`,
        !responsive && `md:grid-cols-${columns}`,
        `gap-${gap}`
    );

    function getColumnSpanClass(field: any): string {
        if (!field.columnSpan) return '';
        return `md:col-span-${field.columnSpan}`;
    }
</script>

<!-- Only render grid if there are fields to show -->
{#if filteredFields.length > 0}
    <div class={gridClasses}>
        {#each filteredFields as field (field.name)}
            <div class={cn('space-y-2', getColumnSpanClass(field))}>
                <FormFieldComponent 
                    {field}
                    fieldId="{componentId}-{field.name}"
                    bind:value={formData[field.name]}
                />
            </div>
        {/each}
    </div>
{/if} 