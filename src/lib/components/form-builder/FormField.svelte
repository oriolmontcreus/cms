<script lang="ts">
    import type { FormField } from './types';
    import { Label } from '@components/ui/label';
    import TextInput from './fields/TextInput.svelte';
    import TextareaInput from './fields/TextareaInput.svelte';
    import NumberInput from './fields/NumberInput.svelte';
    import DateInput from './fields/DatePicker.svelte';
    import SelectInput from './fields/SelectInput.svelte';
    import EmailInput from './fields/EmailInput.svelte';
    import ToggleInput from './fields/ToggleInput.svelte';

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
        email: EmailInput,
        toggle: ToggleInput
    };

    $: FieldComponent = fieldComponents[field.type] || TextInput;
</script>

<div class="space-y-2">
    {#if field.type !== 'toggle'}
        <Label for={fieldId}>{field.label}</Label>
    {/if}
    
    <svelte:component 
        this={FieldComponent}
        {field}
        {fieldId}
        bind:value
        decimalSeparator={field.decimalSeparator || '.'}
    />
    
    {#if field.helperText}
        <p class="text-sm text-muted-foreground" id="{fieldId}-help">{field.helperText}</p>
    {/if}
</div> 