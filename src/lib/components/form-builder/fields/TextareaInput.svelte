<script lang="ts">
    import type { FormField } from "../types";
    import { Textarea } from "@components/ui/textarea";
    import { onMount } from "svelte";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";

    let textareaElement: HTMLTextAreaElement | null = null;

    function autoResizeTextarea() {
        if (!textareaElement || !field.autoResize) return;
        textareaElement.style.height = "auto";
        textareaElement.style.height = textareaElement.scrollHeight + "px";
    }

    // Auto-resize when the component mounts and when value changes
    onMount(() => {
        if (field.autoResize) {
            autoResizeTextarea();
        }
    });

    // Auto-resize when value changes
    $: if (field.autoResize && textareaElement) {
        autoResizeTextarea();
    }

    // Handle input event for real-time resizing
    function handleInput() {
        if (field.autoResize) {
            autoResizeTextarea();
        }
    }

    // Compute style based on resizable and autoResize properties
    $: computedStyle = (() => {
        let style = "";

        if (field.resizable === false) {
            style += "resize: none;";
        } else if (!field.autoResize) {
            style += "resize: vertical;";
        }

        if (field.autoResize) {
            style += "resize: none; overflow-y: hidden;";
        }

        return style;
    })();
</script>

{#if field.autoResize}
    <Textarea
        bind:ref={textareaElement}
        id={fieldId}
        name={fieldId}
        placeholder={field.placeholder}
        required={field.required}
        disabled={field.disabled}
        readonly={field.readonly}
        minlength={field.min}
        maxlength={field.max}
        rows={field.rows}
        style={computedStyle}
        oninput={handleInput}
        bind:value
    />
{:else}
    <Textarea
        id={fieldId}
        name={fieldId}
        placeholder={field.placeholder}
        required={field.required}
        disabled={field.disabled}
        readonly={field.readonly}
        minlength={field.min}
        maxlength={field.max}
        rows={field.rows}
        style={computedStyle}
        bind:value
    />
{/if}
