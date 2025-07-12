<script lang="ts">
    import type { FormField } from './types';
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
</script>

{#if field.type === 'text'}
    <TextInput {field} {fieldId} bind:value />
{:else if field.type === 'textarea'}
    <TextareaInput {field} {fieldId} bind:value />
{:else if field.type === 'number'}
    <NumberInput {field} {fieldId} bind:value />
{:else if field.type === 'date'}
    <DatePicker {field} {fieldId} bind:value />
{:else if field.type === 'dateRange'}
    <DateRangePicker {field} {fieldId} bind:value />
{:else if field.type === 'select'}
    <SelectInput {field} {fieldId} bind:value />
{:else if field.type === 'email'}
    <EmailInput {field} {fieldId} bind:value />
{:else if field.type === 'toggle'}
    <ToggleInput {field} {fieldId} bind:value />
{:else if field.type === 'color'}
    <ColorPicker {field} {fieldId} bind:value />
{:else if field.type === 'richtext'}
    <RichEditor {field} {fieldId} bind:value />
{:else if field.type === 'file'}
    <FileInput {field} {fieldId} bind:value />
{:else if field.type === 'repeatable'}
    <RepeatableField {field} {fieldId} bind:value />
{/if} 