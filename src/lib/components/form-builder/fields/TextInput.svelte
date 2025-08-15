<script lang="ts">
    import type { FormField } from "../types";
    import { tick } from "svelte";
    import { cn } from "$lib/utils";
    import { useGlobalVariables } from "../composables/useGlobalVariables";
    import { useVariablePopover } from "../composables/useVariablePopover";
    import { useVariableTooltip } from "../composables/useVariableTooltip";
    import { useContentEditable } from "../composables/useContentEditable";
    import VariablePopover from "../components/VariablePopover.svelte";
    import VariableTooltip from "../components/VariableTooltip.svelte";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";

    let editableElement: HTMLDivElement;
    let isUpdating = false;

    const hasPrefix = field.prefix !== undefined;
    const hasSuffix = field.suffix !== undefined;
    const inputClasses = cn(hasPrefix && "ps-9", hasSuffix && "pe-9");
    const prefixIsString = typeof field.prefix === "string";
    const suffixIsString = typeof field.suffix === "string";

    // Use composables
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
        console.log("📝 updateElementContent called with:");
        console.log("  - newValue:", JSON.stringify(newValue));
        console.log("  - preserveCursor:", preserveCursor);
        console.log("  - isUpdating:", isUpdating);

        if (!editableElement || isUpdating) {
            console.log(
                "📝 updateElementContent: Early return - no element or updating",
            );
            return;
        }

        console.log(
            "📝 updateElementContent: Before update, element innerHTML:",
            editableElement.innerHTML,
        );
        console.log(
            "📝 updateElementContent: Before update, element textContent:",
            JSON.stringify(editableElement.textContent),
        );

        isUpdating = true;
        contentEditable.updateElementContent(
            editableElement,
            newValue,
            globalVariables.renderTextWithVariables,
            preserveCursor,
        );

        console.log(
            "📝 updateElementContent: After update, element innerHTML:",
            editableElement.innerHTML,
        );
        console.log(
            "📝 updateElementContent: After update, element textContent:",
            JSON.stringify(editableElement.textContent),
        );

        isUpdating = false;
    }

    function closeAndFocusTrigger() {
        popover.closePopover();
        tick().then(() => {
            if (editableElement) {
                editableElement.focus();
            }
        });
    }

    function handleInput(event: Event) {
        if (isUpdating) return;

        const target = event.target as HTMLDivElement;
        const inputValue = target.textContent || "";
        const cursorPos =
            contentEditable.getCurrentCursorPosition(editableElement);

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
                        editableElement,
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
            contentEditable.getCurrentCursorPosition(editableElement);
        editableElement.innerHTML =
            globalVariables.renderTextWithVariables(inputValue);
        contentEditable.setCursorPosition(editableElement, currentCursorPos);
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
            contentEditable.getCurrentCursorPosition(editableElement);

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

        // First check if we're trying to edit inside a variable block
        const preventedEdit = contentEditable.preventEditingInsideVariable(
            value,
            currentCursorPosition,
            event,
            updateValueAndCursor,
        );
        if (preventedEdit) {
            return;
        }

        if (event.key === "Enter" && !popover.isOpen) {
            event.preventDefault();
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
            contentEditable.setCursorPosition(editableElement, newCursorPos);
        });
    }

    function handleFocus() {}

    function handleBlur() {
        tooltip.hideTooltip();
    }

    function insertVariable(variableName: string) {
        console.log("🔀 insertVariable called with:", variableName);
        console.log("🔀 Current value before insert:", JSON.stringify(value));

        contentEditable.insertTextAtCursor(
            editableElement,
            value,
            variableName,
            (newValue: string, newCursorPos: number) => {
                console.log(
                    "🔀 insertVariable callback - newValue:",
                    JSON.stringify(newValue),
                );
                console.log(
                    "🔀 insertVariable callback - newCursorPos:",
                    newCursorPos,
                );

                value = newValue;
                closeAndFocusTrigger();

                tick().then(() => {
                    console.log(
                        "🔀 About to call updateElementContent with:",
                        JSON.stringify(newValue),
                    );
                    updateElementContent(newValue, false);
                    contentEditable.setCursorPosition(
                        editableElement,
                        newCursorPos,
                    );
                    console.log("🔀 insertVariable completed");
                });
            },
        );
    }
</script>

<div class="relative">
    <div class="relative w-full">
        <div
            bind:this={editableElement}
            contenteditable="true"
            spellcheck="false"
            role="textbox"
            tabindex="0"
            id={fieldId}
            class={cn(
                "border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-neutral-500 flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base outline-none transition-all duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                inputClasses,
            )}
            style="line-height: 20px; padding: 8px 12px; display: block; white-space: nowrap; overflow-x: scroll; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none;"
            data-placeholder={field.placeholder}
            oninput={handleInput}
            onkeydown={handleKeydown}
            onmouseover={tooltip.handleMouseOver}
            onmouseout={tooltip.handleMouseOut}
            onfocus={handleFocus}
            onblur={handleBlur}
        >
            {@html globalVariables.renderTextWithVariables(value)}
        </div>

        <input
            type="hidden"
            name={fieldId}
            bind:value
            required={field.required}
            disabled={field.disabled}
            readonly={field.readonly}
            minlength={field.min}
            maxlength={field.max}
            pattern={field.pattern}
        />

        {#if hasPrefix}
            <div
                class="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50"
            >
                {#if prefixIsString}
                    <span class="text-sm font-medium">{field.prefix}</span>
                {:else}
                    <svelte:component
                        this={field.prefix}
                        size={16}
                        aria-hidden="true"
                    />
                {/if}
            </div>
        {/if}

        {#if hasSuffix}
            <div
                class="text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 peer-disabled:opacity-50"
            >
                {#if suffixIsString}
                    <span class="text-sm font-medium">{field.suffix}</span>
                {:else}
                    <svelte:component
                        this={field.suffix}
                        size={16}
                        aria-hidden="true"
                    />
                {/if}
            </div>
        {/if}
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

    [contenteditable] {
        white-space: nowrap;
        overflow-x: scroll;
        overflow-y: hidden;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    [contenteditable]::-webkit-scrollbar {
        display: none;
    }

    :global([contenteditable] br) {
        display: none;
    }

    :global([contenteditable] *) {
        display: inline;
    }
</style>
