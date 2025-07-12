<script lang="ts">
    import type { SchemaItem } from '../types';
    import FormFieldComponent from '../FormField.svelte';
    import { isFormField, convertToFormField } from '../utils/formHelpers';
    import { CSS_CLASSES } from '../constants';
    
    export let schema: SchemaItem[];
    export let componentId: string;
    export let formData: Record<string, any>;
    export let formBuilderContext: any;
</script>

<div class={CSS_CLASSES.FLEX_COLUMN_GAP}>
    {#each schema as item (isFormField(item) ? convertToFormField(item)?.name || `item-${Math.random()}` : `item-${Math.random()}`)}
        {#if isFormField(item)}
            {@const field = convertToFormField(item)}
            {#if field}
                <FormFieldComponent 
                    {field}
                    fieldId="{componentId}-{field.name}"
                    bind:value={formData[field.name]}
                    {formBuilderContext}
                />
            {/if}
        {/if}
    {/each}
</div> 