<script lang="ts">
    import { cn } from "$lib/utils";
    import { useGlobalVariables } from "../composables/useGlobalVariables";
    import { useVariablePopover } from "../composables/useVariablePopover";
    import { useVariableTooltip } from "../composables/useVariableTooltip";
    import { useContentEditable } from "../composables/useContentEditable";
    import VariablePopover from "../components/VariablePopover.svelte";
    import VariableTooltip from "../components/VariableTooltip.svelte";
    import { tick } from "svelte";
    import type { FormField } from "../types";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";
    export let placeholder: string = "Enter text with variables...";
    export let validationError: string | null = null;
    export let rows: number = 4;

    let textareaElement: HTMLDivElement;
    let isUpdating = false;

    // Auto-resize functionality (only when enabled)
    function autoResize() {
        if (!field.autoResize || !textareaElement) return;
        textareaElement.style.height = "auto";

        // Set height based on scroll height, with min and max constraints
        const minHeight = rows * 24; // approximately 1.5rem per row
        const maxHeight = Math.max(400, minHeight * 3); // max 3x the initial height
        const newHeight = Math.max(
            minHeight,
            Math.min(textareaElement.scrollHeight, maxHeight),
        );

        textareaElement.style.height = `${newHeight}px`;
    }

    // Use the same composables as TextInput
    const globalVariables = useGlobalVariables();
    const { data: globalVariablesData, variableNames } = globalVariables;
    const tooltip = useVariableTooltip(
        globalVariables.getCurrentGlobalVariablesData,
    );
    const contentEditable = useContentEditable();

    const popover = useVariablePopover(
        () => $variableNames,
        (variableName: string) => {
            insertVariable(variableName);
        },
    );

    function updateElementContent(newValue: string, preserveCursor = true) {
        if (!textareaElement || isUpdating) return;

        isUpdating = true;
        contentEditable.updateElementContent(
            textareaElement,
            newValue,
            globalVariables.renderTextWithVariables,
            preserveCursor,
        );
        isUpdating = false;
    }

    function handleInput(event: Event) {
        if (isUpdating) return;

        const target = event.target as HTMLDivElement;
        const inputValue = target.textContent || "";
        const cursorPos =
            contentEditable.getCurrentCursorPosition(textareaElement);

        // Check if cursor is inside a variable block and prevent editing
        const insideBlock = contentEditable.isInsideVariableBlock(
            inputValue,
            cursorPos,
        );
        if (insideBlock.isInside) {
            // Restore previous value and move cursor to end of block
            target.textContent = value;
            if (insideBlock.blockEnd) {
                tick().then(() => {
                    contentEditable.setCursorPosition(
                        textareaElement,
                        insideBlock.blockEnd!,
                    );
                });
            }
            return;
        }

        value = inputValue;

        // Re-render with variable highlighting without changing cursor position
        isUpdating = true;
        const currentCursorPos =
            contentEditable.getCurrentCursorPosition(textareaElement);
        textareaElement.innerHTML =
            globalVariables.renderTextWithVariables(inputValue);
        contentEditable.setCursorPosition(textareaElement, currentCursorPos);
        isUpdating = false;

        autoResize();

        const textBeforeCursor = inputValue.substring(
            Math.max(0, cursorPos - 50),
            cursorPos,
        );
        const matchIndex = textBeforeCursor.lastIndexOf("{{");

        if (matchIndex !== -1) {
            const searchStart = matchIndex + 2;
            const potentialQuery = textBeforeCursor.substring(searchStart);

            if (!potentialQuery.includes("}}")) {
                popover.openPopover(potentialQuery);
                return;
            }
        }

        popover.closePopover();
    }

    function handleKeydown(event: KeyboardEvent) {
        const currentCursorPosition =
            contentEditable.getCurrentCursorPosition(textareaElement);

        // Handle cursor navigation to jump over variable blocks
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            const navigationHandled = contentEditable.handleCursorNavigation(
                value,
                currentCursorPosition,
                event.key,
                updateValueAndCursor,
            );
            if (navigationHandled) {
                event.preventDefault();
                return;
            }
        }

        // Check if we're trying to edit inside a variable block
        const preventedEdit = contentEditable.preventEditingInsideVariable(
            value,
            currentCursorPosition,
            event,
            updateValueAndCursor,
        );
        if (preventedEdit) {
            return;
        }

        if (event.key === "Backspace" || event.key === "Delete") {
            const deleteSuccess = contentEditable.handleVariableBlockDeletion(
                value,
                event.key,
                currentCursorPosition,
                updateValueAndCursor,
            );
            if (deleteSuccess) {
                event.preventDefault();
                return;
            }
        }

        // Let the popover handle its own keydown events
        const handled = popover.handleKeydown(event);
        if (handled) {
            return;
        }
    }

    function updateValueAndCursor(newValue: string, newCursorPos: number) {
        value = newValue;
        tick().then(() => {
            updateElementContent(newValue, false);
            contentEditable.setCursorPosition(textareaElement, newCursorPos);
            autoResize();
        });
    }

    function insertVariable(variableName: string) {
        contentEditable.insertTextAtCursor(
            textareaElement,
            value,
            variableName,
            (newValue: string, newCursorPos: number) => {
                value = newValue;
                popover.closePopover();

                tick().then(() => {
                    updateElementContent(newValue, false);
                    contentEditable.setCursorPosition(
                        textareaElement,
                        newCursorPos,
                    );
                    autoResize();
                });
            },
        );
    }

    function handleBlur() {
        tooltip.hideTooltip();
    }
</script>

<div class="relative">
    <div
        bind:this={textareaElement}
        id={fieldId}
        contenteditable="true"
        spellcheck="false"
        role="textbox"
        tabindex="0"
        data-auto-resize={field.autoResize ? "true" : undefined}
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
        data-placeholder={placeholder}
        oninput={handleInput}
        onkeydown={handleKeydown}
        onmouseover={tooltip.handleMouseOver}
        onmouseout={tooltip.handleMouseOut}
        onfocus={() => {}}
        onblur={handleBlur}
    >
        {@html globalVariables.renderTextWithVariables(value)}
    </div>

    <VariablePopover
        popoverState={popover.state}
        globalVariablesData={$globalVariablesData}
        onVariableSelect={popover.selectVariable}
    />

    <VariableTooltip tooltipState={tooltip.state} />
</div>

<style>
    [contenteditable]:empty::before {
        content: attr(data-placeholder);
        color: var(--muted-foreground);
        pointer-events: none;
    }

    /* For manual resize textareas, only animate focus/border/ring states, not size */
    [contenteditable]:not([data-auto-resize]) {
        transition:
            border-color 300ms ease-in-out,
            box-shadow 300ms ease-in-out,
            background-color 300ms ease-in-out,
            color 300ms ease-in-out,
            opacity 300ms ease-in-out;
    }

    :global(.variable-highlight) {
        color: var(--primary);
        font-weight: 500;
        border-radius: 0.25rem;
        padding: 0.125rem 0.25rem;
        margin: 0 1px;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas,
            "Liberation Mono", Menlo, monospace;
        display: inline;
        white-space: pre-wrap;
        cursor: help;
        transition: background-color 0.15s ease;
    }

    :global(.variable-highlight:hover) {
        background-color: var(--accent);
    }
</style>
