<script lang="ts">
    import type { FormField } from "../types";
    import { onMount } from "svelte";
    import { Input } from "@components/ui/input";
    import { cn } from "$lib/utils";
    import * as Command from "@components/ui/command";
    import { handleGetGlobalVariables } from "@/services/globalVariables.service";
    import { IconVariable } from "@tabler/icons-svelte";

    console.log(
        "[GlobalVariables] TextInputWithGlobalVariables component loaded",
    );

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";

    let inputComponent: any; // Svelte Input component reference
    let inputElement: HTMLInputElement; // Actual DOM element reference
    let showPopover = false;
    let cursorPosition = 0;
    let searchQuery = "";
    let globalVariableNames: string[] = [];
    let filteredVariables: string[] = [];
    let selectedIndex = 0;

    // Store for global variables data
    let globalVariablesData: Record<string, any> = {};

    $: hasPrefix = field.prefix !== undefined;
    $: hasSuffix = field.suffix !== undefined;
    $: inputClasses = cn(hasPrefix && "ps-9", hasSuffix && "pe-9");

    onMount(async () => {
        // Load global variables on mount
        console.log("[GlobalVariables] Loading global variables...");
        const data = await handleGetGlobalVariables();
        globalVariablesData = data;
        console.log("[GlobalVariables] Loaded data:", data);

        // Extract variable names (excluding 'translations' and 'updatedAt')
        globalVariableNames = Object.keys(data).filter(
            (key) =>
                key !== "translations" &&
                key !== "updatedAt" &&
                typeof data[key] !== "object",
        );
        console.log(
            "[GlobalVariables] Available variable names:",
            globalVariableNames,
        );

        // Get the actual DOM element from the Svelte Input component
        if (inputComponent && inputComponent.ref) {
            inputElement = inputComponent.ref;
            console.log(
                "[GlobalVariables] Got DOM element from Input component:",
                inputElement,
            );
        }
    });

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const inputValue = target.value;
        cursorPosition = target.selectionStart || 0;

        console.log("[GlobalVariables] Input changed:", {
            inputValue,
            cursorPosition,
            globalVariableNames: globalVariableNames.length,
        });

        value = inputValue;

        // Check if user typed {{ at cursor position
        const textBeforeCursor = inputValue.substring(0, cursorPosition);
        const match = textBeforeCursor.match(/\{\{([^}]*)$/);

        console.log("[GlobalVariables] Pattern check:", {
            textBeforeCursor,
            match: match ? match[0] : null,
            searchTerm: match ? match[1] : null,
        });

        if (match) {
            searchQuery = match[1];
            filteredVariables = globalVariableNames.filter((name) =>
                name.toLowerCase().includes(searchQuery.toLowerCase()),
            );
            selectedIndex = 0;
            showPopover = true;
            console.log("[GlobalVariables] Showing popover:", {
                searchQuery,
                filteredVariables,
                showPopover,
            });
        } else {
            showPopover = false;
            searchQuery = "";
            console.log("[GlobalVariables] Hiding popover");
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (!showPopover) return;

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
                if (filteredVariables[selectedIndex]) {
                    insertVariable(filteredVariables[selectedIndex]);
                }
                break;
            case "Escape":
                showPopover = false;
                break;
        }
    }

    function insertVariable(variableName: string) {
        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);

        // Find the {{ pattern and replace it
        const beforeMatch = textBeforeCursor.replace(
            /\{\{[^}]*$/,
            `{{${variableName}}}`,
        );
        value = beforeMatch + textAfterCursor;

        // Update cursor position
        const newCursorPos = beforeMatch.length;

        showPopover = false;

        // Focus back to input and set cursor position
        setTimeout(() => {
            if (inputElement) {
                inputElement.focus();
                inputElement.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }

    function selectVariable(variableName: string) {
        insertVariable(variableName);
    }

    function isString(value: any): value is string {
        return typeof value === "string";
    }

    // Get popover positioning
    function getPopoverPosition() {
        console.log(
            "[GlobalVariables] getPopoverPosition called, inputElement:",
            inputElement,
        );

        // Try to get the DOM element using getElementById as fallback
        if (
            !inputElement ||
            typeof inputElement.getBoundingClientRect !== "function"
        ) {
            const domElement = document.getElementById(fieldId);
            if (domElement) {
                inputElement = domElement as HTMLInputElement;
                console.log(
                    "[GlobalVariables] Retrieved DOM element using getElementById:",
                    inputElement,
                );
            }
        }

        if (!inputElement) {
            console.log(
                "[GlobalVariables] No input element for positioning, using default position",
            );
            return { x: 100, y: 100 }; // Fallback position
        }

        console.log(
            "[GlobalVariables] inputElement type:",
            typeof inputElement,
            inputElement,
        );

        // Check if inputElement has getBoundingClientRect method
        if (typeof inputElement.getBoundingClientRect !== "function") {
            console.error(
                "[GlobalVariables] inputElement does not have getBoundingClientRect method",
                inputElement,
            );
            return { x: 100, y: 100 }; // Fallback position
        }

        const rect = inputElement.getBoundingClientRect();
        const position = {
            x: rect.left,
            y: rect.bottom + window.scrollY,
        };
        console.log(
            "[GlobalVariables] Popover position:",
            position,
            "Input rect:",
            rect,
        );
        return position;
    }
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
                    {#if isString(field.prefix)}
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
                    {#if isString(field.suffix)}
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

    <!-- Global Variables Autocomplete Popover -->
    {#if showPopover && filteredVariables.length > 0}
        <div
            class="fixed bg-popover text-popover-foreground border rounded-md shadow-md p-0 w-80 max-h-60 overflow-y-auto z-50"
            style="left: {getPopoverPosition().x}px; top: {getPopoverPosition()
                .y + 4}px;"
        >
            <Command.Root>
                <Command.List>
                    <Command.Empty>No global variables found.</Command.Empty>
                    <Command.Group heading="Global Variables" class="p-2">
                        {#each filteredVariables as variable, index (variable)}
                            <div
                                class={cn(
                                    "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground",
                                    index === selectedIndex &&
                                        "bg-accent text-accent-foreground",
                                )}
                                on:click={() => selectVariable(variable)}
                                on:keydown={(e) =>
                                    e.key === "Enter" &&
                                    selectVariable(variable)}
                                role="option"
                                aria-selected={index === selectedIndex}
                                tabindex="-1"
                            >
                                <IconVariable
                                    class="h-4 w-4 text-muted-foreground"
                                />
                                <span class="font-mono text-sm"
                                    >{{ variable }}</span
                                >
                                <span
                                    class="text-xs text-muted-foreground ml-auto truncate max-w-32"
                                >
                                    {globalVariablesData[variable]
                                        ? String(
                                              globalVariablesData[variable],
                                          ).slice(0, 30) +
                                          (String(globalVariablesData[variable])
                                              .length > 30
                                              ? "..."
                                              : "")
                                        : ""}
                                </span>
                            </div>
                        {/each}
                    </Command.Group>
                </Command.List>
            </Command.Root>
        </div>
    {/if}

    <!-- Debug display (remove this after testing) -->
    {#if showPopover}
        <div
            class="fixed top-4 right-4 bg-red-100 border border-red-300 p-2 text-xs z-[9999] max-w-sm"
        >
            <div><strong>Debug Info:</strong></div>
            <div>showPopover: {showPopover}</div>
            <div>filteredVariables: {filteredVariables.length}</div>
            <div>globalVariableNames: {globalVariableNames.length}</div>
            <div>searchQuery: "{searchQuery}"</div>
            <div>value: "{value}"</div>
            <div><strong>Available vars:</strong></div>
            {#each globalVariableNames.slice(0, 5) as varName}
                <div>- {varName}: {globalVariablesData[varName]}</div>
            {/each}
            {#if globalVariableNames.length > 5}
                <div>... and {globalVariableNames.length - 5} more</div>
            {/if}
        </div>
    {/if}
</div>
