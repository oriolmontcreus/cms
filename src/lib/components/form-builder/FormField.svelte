<script lang="ts">
    import type { FormField } from './types';
    import { Label } from '@components/ui/label';
    import TextInput from './fields/TextInput.svelte';
    import TextareaInput from './fields/TextareaInput.svelte';
    import NumberInput from './fields/NumberInput.svelte';
    import DateInput from './fields/DatePicker.svelte';
    import DateRangeInput from './fields/DateRangePicker.svelte';
    import SelectInput from './fields/SelectInput.svelte';
    import EmailInput from './fields/EmailInput.svelte';
    import ToggleInput from './fields/ToggleInput.svelte';
    import ColorInput from './fields/ColorPicker.svelte';
    import RichEditorInput from './fields/RichEditor.svelte';
    import FileInput from './fields/file-input/FileInput.svelte';

    export let field: FormField;
    export let fieldId: string;
    export let value: any;

    // Field component mapping - easy to extend with new field types
    const fieldComponents: Record<string, any> = {
        text: TextInput,
        textarea: TextareaInput,
        number: NumberInput,
        date: DateInput,
        dateRange: DateRangeInput,
        select: SelectInput,
        email: EmailInput,
        toggle: ToggleInput,
        color: ColorInput,
        richtext: RichEditorInput,
        file: FileInput
    };

    $: FieldComponent = fieldComponents[field.type] || TextInput;
    $: showMaxValue = field.type === 'number' && field.max !== undefined;
    $: showCharCount = field.type === 'textarea' && field.max !== undefined;
    $: currentLength = field.type === 'textarea' ? (value?.length || 0) : 0;
    $: hasHelperText = field.helperText || showMaxValue || showCharCount;
    $: shouldShowHelperSection = hasHelperText && field.type !== 'richtext';
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
    
    {#if shouldShowHelperSection}
        <div class="flex justify-between items-center text-sm text-muted-foreground">
            {#if field.helperText}
                <p id="{fieldId}-help">{field.helperText}</p>
            {:else}
                <div></div>
            {/if}
            {#if showMaxValue}
                <span class="text-xs">Max: {field.max}</span>
            {:else if showCharCount}
                <span class="text-xs tabular-nums">{currentLength}/{field.max}</span>
            {/if}
        </div>
    {/if}
</div> 