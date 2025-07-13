<script lang="ts">
    import type { FormField } from './types';
    import { Label } from '@components/ui/label';
    import { CSS_CLASSES } from './constants';
    
    // Import all field components
    import TextInput from './fields/TextInput.svelte';
    import TextareaInput from './fields/TextareaInput.svelte';
    import NumberInput from './fields/NumberInput.svelte';
    import DatePicker from './fields/DatePicker.svelte';
    import DateRangePicker from './fields/DateRangePicker.svelte';
    import SelectInput from './fields/SelectInput.svelte';
    import EmailInput from './fields/EmailInput.svelte';
    import ToggleInput from './fields/ToggleInput.svelte';
    import ColorPicker from './fields/ColorPicker.svelte';
    import RichEditor from './fields/RichEditor.svelte';
    import FileInput from './fields/file-input/FileInput.svelte';
    import RepeatableField from './fields/RepeatableField.svelte';

    export let field: FormField;
    export let fieldId: string;
    export let value: any = undefined;
    export let compact: boolean = false;

    const FIELD_COMPONENTS: Record<string, any> = {
        'text': TextInput,
        'textarea': TextareaInput,
        'number': NumberInput,
        'date': DatePicker,
        'dateRange': DateRangePicker,
        'select': SelectInput,
        'email': EmailInput,
        'toggle': ToggleInput,
        'color': ColorPicker,
        'richtext': RichEditor,
        'file': FileInput,
        'repeatable': RepeatableField
    };

    $: FieldComponent = FIELD_COMPONENTS[field.type];
</script>

<div class={compact ? "space-y-1" : "space-y-2"}>
    {#if field.type !== 'toggle'}
        <div>
            <Label for={fieldId} class={compact ? "text-xs font-medium" : CSS_CLASSES.LABEL}>
                {field.label}
            </Label>
            {#if field.helperText && !compact}
                <p class={CSS_CLASSES.HELPER_TEXT}>{field.helperText}</p>
            {/if}
        </div>
    {/if}

    {#if FieldComponent}
        <svelte:component this={FieldComponent} {field} {fieldId} bind:value />
    {:else}
        <div class="text-red-500 text-sm">
            Unknown field type: {field.type}
        </div>
    {/if}
</div> 