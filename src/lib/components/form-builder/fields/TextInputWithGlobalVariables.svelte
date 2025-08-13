<script lang="ts">
    import type { FormField } from "../types";
    import { onMount, onDestroy, tick } from "svelte";
    import { Input } from "@components/ui/input";
    import { cn } from "$lib/utils";
    import * as Command from "@components/ui/command";
    import { globalVariablesStore } from "@/stores/globalVariables";
    import { IconVariable } from "@tabler/icons-svelte";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";

    let inputElement: HTMLInputElement;
    let showPopover = false;
    let cursorPosition = 0;
    let searchQuery = "";
    let filteredVariables: string[] = [];
    let selectedIndex = 0;

    // Performance: Cache position to avoid DOM calls in reactive context
    let popoverPosition = { x: 0, y: 0 };

    // Performance: Cache computed values
    let globalVariableNames: string[] = [];
    let globalVariablesData: Record<string, any> = {};

    // Performance: Memoize CSS classes
    const hasPrefix = field.prefix !== undefined;
    const hasSuffix = field.suffix !== undefined;
    const inputClasses = cn(hasPrefix && "ps-9", hasSuffix && "pe-9");

    // Performance: Cache string type check result for prefix/suffix
    const prefixIsString = typeof field.prefix === "string";
    const suffixIsString = typeof field.suffix === "string";

    // Single subscription for optimal reactivity
    const unsubscribe = globalVariablesStore.subscribe((state) => {
        globalVariableNames = state.variableNames;
        globalVariablesData = state.data;
    });

    onMount(async () => {
        await globalVariablesStore.load();
    });

    onDestroy(() => {
        unsubscribe();
    });

    // Performance: Optimized input handler with early returns
    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const inputValue = target.value;
        const newCursorPosition = target.selectionStart || 0;

        // Early return if no change in cursor position and no {{ pattern
        if (inputValue === value && newCursorPosition === cursorPosition)
            return;

        value = inputValue;
        cursorPosition = newCursorPosition;

        // Optimized pattern matching
        const textBeforeCursor = inputValue.substring(
            Math.max(0, cursorPosition - 50),
            cursorPosition,
        );
        const matchIndex = textBeforeCursor.lastIndexOf("{{");

        if (matchIndex !== -1) {
            const searchStart = matchIndex + 2;
            const potentialQuery = textBeforeCursor.substring(searchStart);

            // Only proceed if we don't have a closing }}
            if (!potentialQuery.includes("}}")) {
                searchQuery = potentialQuery;
                updateFilteredVariables();
                selectedIndex = 0;
                showPopoverWithPosition();
                return;
            }
        }

        showPopover = false;
        searchQuery = "";
    }

    // Performance: Separate function for filtering to avoid inline operations
    function updateFilteredVariables() {
        if (!searchQuery) {
            filteredVariables = globalVariableNames.slice(0, 10); // Limit results for performance
            return;
        }

        const query = searchQuery.toLowerCase();
        filteredVariables = globalVariableNames
            .filter((name) => name.toLowerCase().includes(query))
            .slice(0, 10); // Always limit results
    }

    // Update popover position when showing
    function updatePopoverPosition() {
        // Try to get the actual DOM element
        let domElement = inputElement;

        // If inputElement is a Svelte component, try to get the DOM element
        if (inputElement && !inputElement.getBoundingClientRect) {
            // Try common ways to get DOM element from UI component
            domElement =
                inputElement.$el ||
                inputElement.getElement?.() ||
                inputElement.element;
        }

        // Fallback: try to find by ID
        if (!domElement || !domElement.getBoundingClientRect) {
            domElement = document.getElementById(fieldId);
        }

        if (!domElement) {
            console.warn(
                "[TextInputWithGlobalVariables] DOM element not found",
            );
            return;
        }

        if (typeof domElement.getBoundingClientRect !== "function") {
            console.warn(
                "[TextInputWithGlobalVariables] getBoundingClientRect not available on:",
                domElement,
            );
            return;
        }

        try {
            const rect = domElement.getBoundingClientRect();
            console.log("[TextInputWithGlobalVariables] Element rect:", rect);

            // Ensure we have valid coordinates
            if (
                rect &&
                typeof rect.left === "number" &&
                typeof rect.bottom === "number"
            ) {
                popoverPosition = {
                    x: rect.left,
                    y: rect.bottom + 4,
                };
                console.log(
                    "[TextInputWithGlobalVariables] Updated popover position:",
                    popoverPosition,
                );
            } else {
                console.error(
                    "[TextInputWithGlobalVariables] Invalid rect:",
                    rect,
                );
            }
        } catch (error) {
            console.error(
                "[TextInputWithGlobalVariables] Error getting element position:",
                error,
            );
        }
    }

    function showPopoverWithPosition() {
        // Ensure element is properly mounted before calculating position
        if (!inputElement) {
            console.warn(
                "[TextInputWithGlobalVariables] Attempting to show popover before element is mounted",
            );
            return;
        }

        updatePopoverPosition();
        showPopover = true;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (!showPopover || filteredVariables.length === 0) return;

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
                showPopover = false;
                break;
        }
    }

    function insertVariable(variableName: string) {
        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);

        // More efficient replacement using lastIndexOf
        const matchIndex = textBeforeCursor.lastIndexOf("{{");
        if (matchIndex === -1) return;

        const beforePattern = textBeforeCursor.substring(0, matchIndex);
        const replacement = `{{${variableName}}}`;

        value = beforePattern + replacement + textAfterCursor;
        const newCursorPos = beforePattern.length + replacement.length;

        showPopover = false;

        // Use tick for more reliable cursor positioning
        tick().then(() => {
            // Get the actual DOM element for focus and cursor positioning
            let domElement = inputElement;

            if (inputElement && !inputElement.focus) {
                domElement =
                    inputElement.$el ||
                    inputElement.getElement?.() ||
                    inputElement.element;
            }

            if (!domElement && fieldId) {
                domElement = document.getElementById(fieldId);
            }

            if (
                domElement &&
                domElement.focus &&
                domElement.setSelectionRange
            ) {
                domElement.focus();
                domElement.setSelectionRange(newCursorPos, newCursorPos);
            }
        });
    }

    // Performance: Remove redundant function
    const selectVariable = insertVariable;
</script>

<div class="relative">
    {#if hasPrefix || hasSuffix}
        <div class="relative">
            <Input
                bind:this={inputElement}
                type="text"
                id={fieldId}
                name={fieldId}
                placeholder={field.placeholder}
                required={field.required}
                disabled={field.disabled}
                readonly={field.readonly}
                minlength={field.min}
                maxlength={field.max}
                pattern={field.pattern}
                class={inputClasses}
                bind:value
                oninput={handleInput}
                onkeydown={handleKeydown}
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
    {:else}
        <Input
            bind:this={inputElement}
            type="text"
            id={fieldId}
            name={fieldId}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            readonly={field.readonly}
            minlength={field.min}
            maxlength={field.max}
            pattern={field.pattern}
            bind:value
            oninput={handleInput}
            onkeydown={handleKeydown}
        />
    {/if}

    <!-- Optimized Popover with safe positioning -->
    {#if showPopover && inputElement && popoverPosition.x > 0 && popoverPosition.y > 0}
        <div
            class="fixed bg-popover text-popover-foreground border rounded-md shadow-md p-0 w-80 max-h-60 overflow-y-auto z-50"
            style="left: {popoverPosition.x}px; top: {popoverPosition.y}px;"
        >
            <Command.Root>
                <Command.List>
                    {#if filteredVariables.length === 0}
                        <Command.Empty>
                            {globalVariableNames.length === 0
                                ? "No global variables loaded."
                                : "No variables match your search."}
                        </Command.Empty>
                    {:else}
                        <Command.Group heading="Global Variables" class="p-2">
                            {#each filteredVariables as varName, index (varName)}
                                <div
                                    class={cn(
                                        "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground",
                                        index === selectedIndex &&
                                            "bg-accent text-accent-foreground",
                                    )}
                                    on:click={() => selectVariable(varName)}
                                    on:keydown={(e) =>
                                        e.key === "Enter" &&
                                        selectVariable(varName)}
                                    role="option"
                                    aria-selected={index === selectedIndex}
                                    tabindex="-1"
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
                                </div>
                            {/each}
                        </Command.Group>
                    {/if}
                </Command.List>
            </Command.Root>
        </div>
    {/if}
</div>
