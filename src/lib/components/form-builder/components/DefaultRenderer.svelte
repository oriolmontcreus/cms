<script lang="ts">
    import type { SchemaItem, TranslationData } from '../types';
    import { RenderMode } from '../types';
    import FormFieldComponent from '../FormField.svelte';
    import { isFormField, convertToFormField, filterSchemaByMode } from '../utils/formHelpers';
    import { CSS_CLASSES } from '../constants';
    
    export let schema: SchemaItem[];
    export let componentId: string;
    export let formData: Record<string, any>;
    export let mode: RenderMode = RenderMode.CONTENT;
    export let currentLocale: string = '';
    export let isDefaultLocale: boolean = true;
    export let translationData: TranslationData = {};
    
    $: filteredSchema = filterSchemaByMode(schema, mode);
</script>

<div class={CSS_CLASSES.FLEX_COLUMN_GAP}>
    {#each filteredSchema as item (isFormField(item) ? convertToFormField(item)?.name || `item-${Math.random()}` : `item-${Math.random()}`)}
        {#if isFormField(item)}
            {@const field = convertToFormField(item)}
            {#if field}
                <FormFieldComponent 
                    {field}
                    fieldId="{componentId}-{field.name}"
                    bind:value={formData[field.name]}
                    isTranslationMode={mode === RenderMode.TRANSLATION}
                    {currentLocale}
                    {isDefaultLocale}
                    {translationData}
                    {componentId}
                    compact={mode === RenderMode.TRANSLATION}
                />
            {/if}
        {/if}
    {/each}
</div> 