<script lang="ts">
    import type { FormField, FieldType } from "../types";
    import FormFieldComponent from "../FormField.svelte";

    export let fieldConfig: Partial<FormField>;
    export let fieldType: FieldType;
    export let value: any;
    export let fieldName: string;
    export let locale: string;

    // Create a unique field ID for the translation context
    $: fieldId = `translation-${fieldName}-${locale}`;

    // Create a minimal field configuration for rendering
    $: renderField = {
        ...fieldConfig,
        name: fieldName,
        type: fieldType,
        label: `${fieldConfig?.label || fieldName} (${locale})`,
        placeholder:
            fieldConfig?.placeholder || `Enter ${fieldName} translation...`,
        required: false, // Don't require translations
    } as FormField;
</script>

<FormFieldComponent
    field={renderField}
    {fieldId}
    bind:value
    validationError={null}
/>
