<script lang="ts">
    import { cn } from "$lib/utils";
    import { useGlobalVariables } from "../composables/useGlobalVariables";
    import { useVariablePopover } from "../composables/useVariablePopover";
    import { useVariableTooltip } from "../composables/useVariableTooltip";
    import { useContentEditable } from "../composables/useContentEditable";
    import VariablePopover from "../components/VariablePopover.svelte";
    import VariableTooltip from "../components/VariableTooltip.svelte";
    import { tick } from "svelte";

    export let value: string = "";
    export let placeholder: string = "Enter text with variables...";
    export let rows: number = 4;

    let textareaElement: HTMLDivElement;
    let isUpdating = false;

    // Use the same composables as TextInput
    const globalVariables = useGlobalVariables();
    const { data: globalVariablesData, variableNames } = globalVariables;
    const tooltip = useVariableTooltip();
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

        value = inputValue;

        // Re-render with variable highlighting without changing cursor position
        isUpdating = true;
        const cursorPos =
            contentEditable.getCurrentCursorPosition(textareaElement);
        textareaElement.innerHTML =
            globalVariables.renderTextWithVariables(inputValue);
        contentEditable.setCursorPosition(textareaElement, cursorPos);
        isUpdating = false;

        // Check for variable pattern to show popover
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
        contenteditable="true"
        spellcheck="false"
        role="textbox"
        tabindex="0"
        class={cn(
            "border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-neutral-500 w-full min-w-0 rounded-md border px-3 py-2 text-base outline-none transition-all duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            "min-h-[80px] whitespace-pre-wrap",
        )}
        style="height: {rows * 1.5}rem; overflow-y: auto;"
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

    :global(.variable-highlight) {
        color: var(--primary);
        font-weight: 500;
        border-radius: 0.25rem;
        padding: 0.125rem 0.25rem;
        margin: 0 1px;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas,
            "Liberation Mono", Menlo, monospace;
        display: inline;
        white-space: nowrap;
        cursor: help;
        transition: background-color 0.15s ease;
    }

    :global(.variable-highlight:hover) {
        background-color: var(--accent);
    }
</style>
