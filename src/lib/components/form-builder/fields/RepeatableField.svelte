<script lang="ts">
    import { Button } from '@/lib/components/ui/button';
    import { Card, CardContent } from '@/lib/components/ui/card';
    import PlusIcon from '@lucide/svelte/icons/plus';
    import TrashIcon from '@lucide/svelte/icons/trash';
    import type { FormField } from '../types';
    import DefaultRenderer from '../components/DefaultRenderer.svelte';
    import { CSS_CLASSES } from '../constants';

    export let field: FormField;
    export let fieldId: string;
    export let value: any[] = [];

    // Initialize empty array if no value
    $: if (!Array.isArray(value)) {
        value = [];
    }

    function addItem() {
        value = [...value, {}];
    }

    function removeItem(index: number) {
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

    <div class="space-y-4" class:grid={field.grid} style={field.grid ? `grid-template-columns: repeat(${field.grid}, minmax(0, 1fr)); gap: 1rem;` : ''}>
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