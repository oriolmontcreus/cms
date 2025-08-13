<script lang="ts">
    import type { FormField } from "../types";
    import { onMount, onDestroy, tick } from "svelte";
    import { cn } from "$lib/utils";
    import * as Command from "@components/ui/command";
    import * as Popover from "@components/ui/popover";
    import { globalVariablesStore } from "@/stores/globalVariables";
    import { IconVariable } from "@tabler/icons-svelte";
    import ScrollArea from "../../ui/scroll-area/scroll-area.svelte";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";

    let editableElement: HTMLDivElement;
    let open = false;
    let searchQuery = "";
    let filteredVariables: string[] = [];
    let selectedIndex = 0;
    let globalVariableNames: string[] = [];
    let globalVariablesData: Record<string, any> = {};
    let isUpdating = false; // Prevent recursive updates

    const hasPrefix = field.prefix !== undefined;
    const hasSuffix = field.suffix !== undefined;
    const inputClasses = cn(hasPrefix && "ps-9", hasSuffix && "pe-9");
    const prefixIsString = typeof field.prefix === "string";
    const suffixIsString = typeof field.suffix === "string";

    // Function to render text with highlighted variables as HTML
    function renderTextWithVariables(text: string): string {
        return text.replace(
            /(\{\{[^}]+\}\})/g,
            '<span class="variable-highlight">$1</span>',
        );
    }

    // Function to get plain text from HTML (for form submission)
    function getPlainTextValue(): string {
        if (!editableElement) return value;
        return editableElement.textContent || "";
    }

    // Simplified function to set cursor position
    function setCursorPosition(element: HTMLElement, offset: number) {
        const range = document.createRange();
        const selection = window.getSelection();

        if (!selection) return;

        // Simple approach: get all text nodes and find the right position
        const textNode = getTextNodeAtOffset(element, offset);
        if (textNode) {
            range.setStart(textNode.node, textNode.offset);
            range.setEnd(textNode.node, textNode.offset);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    // Helper function to find text node at specific offset
    function getTextNodeAtOffset(element: HTMLElement, offset: number) {
        let currentOffset = 0;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

        let node: Text | null = null;
        while ((node = walker.nextNode() as Text)) {
            const length = node.textContent?.length || 0;
            if (currentOffset + length >= offset) {
                return {
                    node,
                    offset: offset - currentOffset,
                };
            }
            currentOffset += length;
        }

        // If we're at the end, return the last text node if it exists
        if (node) {
            return { node, offset: (node as Text).textContent?.length || 0 };
        }
        return null;
    }

    // Simplified function to get current cursor position
    function getCurrentCursorPosition(): number {
        const selection = window.getSelection();
        if (!selection?.rangeCount || !editableElement) return 0;

        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editableElement);
        preCaretRange.setEnd(range.endContainer, range.endOffset);

        return preCaretRange.toString().length;
    }

    const unsubscribe = globalVariablesStore.subscribe((state) => {
        globalVariableNames = state.variableNames;
        globalVariablesData = state.data;
    });

    // Simplified content update function
    function updateElementContent(newValue: string, preserveCursor = true) {
        if (!editableElement || isUpdating) return;

        isUpdating = true;
        const cursorPos = preserveCursor ? getCurrentCursorPosition() : 0;

        editableElement.innerHTML = renderTextWithVariables(newValue);

        if (preserveCursor) {
            setCursorPosition(editableElement, cursorPos);
        }

        isUpdating = false;
    }

    onMount(async () => {
        await globalVariablesStore.load();
    });

    onDestroy(() => {
        unsubscribe();
    });

    function closeAndFocusTrigger() {
        open = false;
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
        const cursorPos = getCurrentCursorPosition();

        // Update the value
        value = inputValue;

        // Update HTML with highlighted variables, preserving cursor
        updateElementContent(inputValue, true);

        // Check for variable autocomplete trigger
        const textBeforeCursor = inputValue.substring(
            Math.max(0, cursorPos - 50),
            cursorPos,
        );
        const matchIndex = textBeforeCursor.lastIndexOf("{{");

        if (matchIndex !== -1) {
            const searchStart = matchIndex + 2;
            const potentialQuery = textBeforeCursor.substring(searchStart);

            if (!potentialQuery.includes("}}")) {
                searchQuery = potentialQuery;
                updateFilteredVariables();
                selectedIndex = 0;
                open = true;
                return;
            }
        }

        open = false;
        searchQuery = "";
    }

    function updateFilteredVariables() {
        if (!searchQuery) {
            filteredVariables = globalVariableNames.slice(0, 10);
            return;
        }

        const query = searchQuery.toLowerCase();
        filteredVariables = globalVariableNames
            .filter((name) => name.toLowerCase().includes(query))
            .slice(0, 10);
    }

    function handleKeydown(event: KeyboardEvent) {
        const currentCursorPosition = getCurrentCursorPosition();

        // Prevent Enter key from creating line breaks
        if (event.key === "Enter" && !open) {
            event.preventDefault();
            return;
        }

        // Handle Backspace and Delete for variable blocks
        if (event.key === "Backspace" || event.key === "Delete") {
            const deleteSuccess = handleVariableBlockDeletion(
                event.key,
                currentCursorPosition,
            );
            if (deleteSuccess) {
                event.preventDefault();
                return;
            }
        }

        if (!open || filteredVariables.length === 0) return;

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                selectedIndex = (selectedIndex + 1) % filteredVariables.length;
                break;
            case "ArrowUp":
                event.preventDefault();
                selectedIndex =
                    selectedIndex === 0
                        ? filteredVariables.length - 1
                        : selectedIndex - 1;
                break;
            case "Enter":
            case "Tab":
                event.preventDefault();
                insertVariable(filteredVariables[selectedIndex]);
                break;
            case "Escape":
                open = false;
                break;
        }
    }

    function handleVariableBlockDeletion(
        key: string,
        cursorPos: number,
    ): boolean {
        // Find all variable matches in the current value
        const variableRegex = /\{\{[^}]+\}\}/g;
        const matches: Array<{ start: number; end: number; content: string }> =
            [];
        let match;

        while ((match = variableRegex.exec(value)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                content: match[0],
            });
        }

        if (key === "Backspace") {
            // Check if cursor is at the end of a variable (right after }})
            const variableAtCursor = matches.find((m) => m.end === cursorPos);
            if (variableAtCursor) {
                // Delete the entire variable
                const newValue =
                    value.substring(0, variableAtCursor.start) +
                    value.substring(variableAtCursor.end);
                updateValueAndCursor(newValue, variableAtCursor.start);
                return true;
            }
        } else if (key === "Delete") {
            // Check if cursor is at the beginning of a variable (right before {{)
            const variableAtCursor = matches.find((m) => m.start === cursorPos);
            if (variableAtCursor) {
                // Delete the entire variable
                const newValue =
                    value.substring(0, variableAtCursor.start) +
                    value.substring(variableAtCursor.end);
                updateValueAndCursor(newValue, variableAtCursor.start);
                return true;
            }
        }

        return false;
    }

    function updateValueAndCursor(newValue: string, newCursorPos: number) {
        value = newValue;
        tick().then(() => {
            updateElementContent(newValue, false);
            setCursorPosition(editableElement, newCursorPos);
        });
    }

    function insertVariable(variableName: string) {
        const cursorPos = getCurrentCursorPosition();
        const textBeforeCursor = value.substring(0, cursorPos);
        const textAfterCursor = value.substring(cursorPos);

        const matchIndex = textBeforeCursor.lastIndexOf("{{");
        if (matchIndex === -1) return;

        const beforePattern = textBeforeCursor.substring(0, matchIndex);
        const replacement = `{{${variableName}}}`;

        value = beforePattern + replacement + textAfterCursor;
        const newCursorPos = beforePattern.length + replacement.length;

        closeAndFocusTrigger();

        tick().then(() => {
            updateElementContent(value, false);
            setCursorPosition(editableElement, newCursorPos);
        });
    }
</script>

<div class="relative">
    <div class="relative w-full">
        <!-- Contenteditable div that looks like an input -->
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
        >
            {@html renderTextWithVariables(value)}
        </div>

        <!-- Hidden input for form submission -->
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

    <Popover.Root bind:open>
        <!-- Hidden trigger that we can programmatically control -->
        <Popover.Trigger class="sr-only" tabindex={-1}>
            <div></div>
        </Popover.Trigger>

        <Popover.Content class="w-80 p-0" align="start">
            <Command.Root>
                <Command.Input
                    placeholder="Search variables..."
                    value={searchQuery}
                    class="border-0 focus:ring-0"
                />
                <Command.List>
                    <ScrollArea class="h-52 flex flex-1 pr-2">
                        {#if filteredVariables.length === 0}
                            <Command.Empty>
                                {globalVariableNames.length === 0
                                    ? "No global variables loaded."
                                    : "No variables match your search."}
                            </Command.Empty>
                        {:else}
                            <Command.Group heading="Global Variables">
                                {#each filteredVariables as varName, index (varName)}
                                    <Command.Item
                                        value={varName}
                                        onSelect={() => insertVariable(varName)}
                                        class={cn(
                                            "flex items-center gap-2 cursor-pointer",
                                            index === selectedIndex &&
                                                "bg-accent text-accent-foreground",
                                        )}
                                    >
                                        <IconVariable
                                            class="h-4 w-4 text-muted-foreground"
                                        />
                                        <span class="font-mono text-sm"
                                            >{varName}</span
                                        >
                                        {#if globalVariablesData[varName]}
                                            {@const value = String(
                                                globalVariablesData[varName],
                                            )}
                                            <span
                                                class="text-xs text-muted-foreground ml-auto truncate max-w-32"
                                            >
                                                {value.length > 30
                                                    ? value.slice(0, 30) + "..."
                                                    : value}
                                            </span>
                                        {/if}
                                    </Command.Item>
                                {/each}
                            </Command.Group>
                        {/if}
                    </ScrollArea>
                </Command.List>
            </Command.Root>
        </Popover.Content>
    </Popover.Root>
</div>

<style>
    [contenteditable]:empty::before {
        content: attr(data-placeholder);
        color: hsl(var(--muted-foreground));
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
    }

    /* Ensure the contenteditable behaves like a single-line input */
    [contenteditable] {
        white-space: nowrap;
        overflow-x: scroll;
        overflow-y: hidden;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE/Edge */
    }

    /* Hide scrollbars in Webkit browsers */
    [contenteditable]::-webkit-scrollbar {
        display: none;
    }

    /* Prevent line breaks */
    :global([contenteditable] br) {
        display: none;
    }

    :global([contenteditable] *) {
        display: inline;
    }
</style>
