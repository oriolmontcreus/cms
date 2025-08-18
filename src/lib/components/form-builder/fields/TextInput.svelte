<script lang="ts">
    import type { FormField } from "../types";
    import SimpleInput from "./textinput/SimpleInput.svelte";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";
    export let type: string = "text";
    export let validationError: string | null = null;

    const supportsVariables = field.allowVariables !== false;

    // Only load variable-related imports if needed
    let VariableInput: any = null;
    if (supportsVariables) {
        import("./textinput/VariableInput.svelte").then((module) => {
            VariableInput = module.default;
        });
    }
</script>

{#if supportsVariables && VariableInput}
    <svelte:component
        this={VariableInput}
        {field}
        {fieldId}
        bind:value
        {type}
        {validationError}
    />
{:else if !supportsVariables}
    <SimpleInput {field} {fieldId} bind:value {type} {validationError} />
{:else}
    <!-- Loading state while VariableInput is being imported -->
    <SimpleInput {field} {fieldId} bind:value {type} {validationError} />
{/if}
