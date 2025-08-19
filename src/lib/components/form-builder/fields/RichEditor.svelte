<script lang="ts">
    import type { FormField } from "../types";
    import SimpleRichEditor from "./rich-editor/SimpleRichEditor.svelte";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";

    const supportsVariables = field.allowVariables !== false;

    // Only load variable-related imports if needed
    let VariableRichEditor: typeof import("./rich-editor/VariableRichEditor.svelte").default | null = null;
    if (supportsVariables) {
        import("./rich-editor/VariableRichEditor.svelte").then((module) => {
            VariableRichEditor = module.default;
        });
    }
</script>

{#if supportsVariables && VariableRichEditor}
    <svelte:component this={VariableRichEditor} {field} {fieldId} bind:value />
{:else if !supportsVariables}
    <SimpleRichEditor {field} {fieldId} bind:value />
{:else}
    <!-- Loading state while VariableRichEditor is being imported -->
    <SimpleRichEditor {field} {fieldId} bind:value />
{/if}
