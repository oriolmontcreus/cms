<script lang="ts">
    import type { FormField } from "../types";
    import SimpleTextarea from "./textarea/SimpleTextarea.svelte";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";
    export let placeholder: string = "Enter text with variables...";
    export let validationError: string | null = null;
    export let rows: number = 4;

    const supportsVariables = field.allowVariables !== false;

    // Only load variable-related imports if needed
    let VariableTextarea: typeof import("./textarea/VariableTextarea.svelte").default = null;
    if (supportsVariables) {
        import("./textarea/VariableTextarea.svelte").then((module) => {
            VariableTextarea = module.default;
        });
    }
</script>

{#if supportsVariables && VariableTextarea}
    <svelte:component
        this={VariableTextarea}
        {field}
        {fieldId}
        bind:value
        {placeholder}
        {validationError}
        {rows}
    />
{:else if !supportsVariables}
    <SimpleTextarea
        {field}
        {fieldId}
        bind:value
        placeholder={placeholder || "Enter text..."}
        {validationError}
        {rows}
    />
{:else}
    <!-- Loading state while VariableTextarea is being imported -->
    <SimpleTextarea
        {field}
        {fieldId}
        bind:value
        placeholder={placeholder || "Loading..."}
        {validationError}
        {rows}
    />
{/if}
