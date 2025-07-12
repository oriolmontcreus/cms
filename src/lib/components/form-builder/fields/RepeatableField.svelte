<script lang="ts">
    import { Button } from '@/lib/components/ui/button';
    import { Card, CardContent } from '@/lib/components/ui/card';
    import PlusIcon from '@tabler/icons-svelte/icons/plus';
    import TrashIcon from '@tabler/icons-svelte/icons/trash';
    import type { FormField } from '../types';
    import DefaultRenderer from '../components/DefaultRenderer.svelte';
    import { CSS_CLASSES } from '../constants';
    import { cn } from '$lib/utils';
    import { getContext } from 'svelte';
    import type { FormBuilderContext } from '../utils/formHelpers';

    export let field: FormField;
    export let fieldId: string;
    export let value: any[] = [];

    // Get context with proper typing
    const formBuilderContext = getContext<FormBuilderContext>('formBuilder');

    // Initialize empty array if no value
    $: if (!Array.isArray(value)) {
        value = [];
    }

    // Responsive grid configuration
    $: gridConfig = field.responsiveGrid;
    $: hasGrid = !!gridConfig;
    $: columns = gridConfig?.columns || 2;
    $: gap = gridConfig?.gap || 4;
    $: responsive = gridConfig?.responsive;

    $: gridClasses = hasGrid ? cn(
        'grid',
        'grid-cols-1',
        responsive?.sm && `sm:grid-cols-${responsive.sm}`,
        responsive?.md && `md:grid-cols-${responsive.md}`,
        responsive?.lg && `lg:grid-cols-${responsive.lg}`,
        !responsive && `md:grid-cols-${columns}`,
        `gap-${gap}`
    ) : 'space-y-4';

    function addItem() {
        value = [...value, {}];
    }

    function removeItem(index: number) {
        // Before removing the item, collect any files for deletion
        const itemToRemove = value[index];
        if (itemToRemove && formBuilderContext?.collectFilesForDeletion) {
            formBuilderContext.collectFilesForDeletion(itemToRemove);
        }
        
        // Remove the item from the array
        value = value.filter((_, i) => i !== index);
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <Button type="button" variant="outline" onclick={addItem}>
            <PlusIcon class="w-4 h-4 mr-2" />
            Add Item
        </Button>
    </div>

    <div class={gridClasses}>
        {#each value as item, index (index)}
            {#if field.contained}
                <Card>
                    <CardContent class="relative pt-6">
                        <button
                            type="button"
                            class="absolute top-2 right-2 text-destructive hover:text-destructive/80"
                            on:click={() => removeItem(index)}
                        >
                            <TrashIcon class="w-4 h-4" />
                        </button>
                        <DefaultRenderer
                            schema={field.schema || []}
                            componentId={`${fieldId}-${index}`}
                            bind:formData={value[index]}
                        />
                    </CardContent>
                </Card>
            {:else}
                <div class="relative">
                    <button
                        type="button"
                        class="absolute -top-2 right-0 text-destructive hover:text-destructive/80"
                        on:click={() => removeItem(index)}
                    >
                        <TrashIcon class="w-4 h-4" />
                    </button>
                    <DefaultRenderer
                        schema={field.schema || []}
                        componentId={`${fieldId}-${index}`}
                        bind:formData={value[index]}
                    />
                </div>
            {/if}
        {/each}
    </div>
</div> 