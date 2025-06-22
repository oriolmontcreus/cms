<script lang="ts">
    import type { FormField } from './types';
    import { Label } from '@components/ui/label';
    import TextInput from './fields/TextInput.svelte';
    import TextareaInput from './fields/TextareaInput.svelte';
    import NumberInput from './fields/NumberInput.svelte';
    import DateInput from './fields/DateInput.svelte';
    import SelectInput from './fields/SelectInput.svelte';
    import EmailInput from './fields/EmailInput.svelte';

    export let field: FormField;
    export let fieldId: string;
    export let value: any;

    // Field component mapping - easy to extend with new field types
    const fieldComponents: Record<string, any> = {
        text: TextInput,
        textarea: TextareaInput,
        number: NumberInput,
        date: DateInput,
        select: SelectInput,
        email: EmailInput
    };

    $: FieldComponent = fieldComponents[field.type] || TextInput;
</script>

<div class="space-y-2">
    <Label for={fieldId}>{field.label}</Label>
    
    <svelte:component 
        this={FieldComponent}
        {field}
        {fieldId}
        bind:value
    />
    
    {#if field.helperText}
        <p class="text-sm text-muted-foreground">{field.helperText}</p>
    {/if}
</div> 