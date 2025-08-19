<script lang="ts">
    import { cn } from "$lib/utils";
    import type { FormField } from "../../types";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";
    export let placeholder: string = "Enter text...";
    export let validationError: string | null = null;
    export let rows: number = 4;

    let textareaElement: HTMLTextAreaElement;

    // Auto-resize functionality (only when enabled)
    function autoResize() {
        if (!field.autoResize || !textareaElement) return;
        textareaElement.style.height = "auto";
        const minHeight = rows * 24; // approximately 1.5rem per row
        const maxHeight = Math.max(400, minHeight * 3); // max 3x the initial height
        const newHeight = Math.max(
            minHeight,
            Math.min(textareaElement.scrollHeight, maxHeight),
        );

        textareaElement.style.height = `${newHeight}px`;
    }
</script>

<div class="relative">
    <textarea
        bind:this={textareaElement}
        id={fieldId}
        bind:value
        {placeholder}
        {rows}
        disabled={field.disabled}
        readonly={field.readonly}
        required={field.required}
        oninput={autoResize}
        class={cn(
            "border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-neutral-500 w-full min-w-0 rounded-md border px-3 py-2 text-base outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            "min-h-[80px]",
            field.autoResize
                ? "resize-none overflow-hidden transition-all duration-300 ease-in-out"
                : "resize-y overflow-auto",
            validationError &&
                "border-destructive focus-visible:border-destructive",
        )}
        style={field.autoResize
            ? "height: auto; word-wrap: break-word; white-space: pre-wrap;"
            : `height: ${rows * 1.5}rem; word-wrap: break-word; white-space: pre-wrap;`}
    ></textarea>
</div>

<style>
    /* For manual resize textareas, only animate focus/border/ring states, not size */
    textarea:not([data-auto-resize]) {
        transition:
            border-color 300ms ease-in-out,
            box-shadow 300ms ease-in-out,
            background-color 300ms ease-in-out,
            color 300ms ease-in-out,
            opacity 300ms ease-in-out;
    }
</style>
