<script lang="ts">
    import type { FormField } from "../types";
    import { onMount, onDestroy, tick } from "svelte";
    import { Input } from "@components/ui/input";
    import { cn } from "$lib/utils";
    import * as Command from "@components/ui/command";
    import * as Popover from "@components/ui/popover";
    import { globalVariablesStore } from "@/stores/globalVariables";
    import { IconVariable } from "@tabler/icons-svelte";
    import ScrollArea from "../../ui/scroll-area/scroll-area.svelte";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";

    let inputElement: any;
    let overlayElement: HTMLDivElement;
    let open = false;
    let cursorPosition = 0;
    let searchQuery = "";
    let filteredVariables: string[] = [];
    let selectedIndex = 0;
    let globalVariableNames: string[] = [];
    let globalVariablesData: Record<string, any> = {};

    const hasPrefix = field.prefix !== undefined;
    const hasSuffix = field.suffix !== undefined;
    const inputClasses = cn(
        hasPrefix && "ps-9",
        hasSuffix && "pe-9",
    );
    const prefixIsString = typeof field.prefix === "string";
    const suffixIsString = typeof field.suffix === "string";

    // Function to parse text and identify variables
    function parseTextWithVariables(
        text: string,
    ): Array<{ content: string; isVariable: boolean }> {
        const parts: Array<{ content: string; isVariable: boolean }> = [];
        const regex = /(\{\{[^}]+\}\})/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Add text before the variable
            if (match.index > lastIndex) {
                parts.push({
                    content: text.substring(lastIndex, match.index),
                    isVariable: false,
                });
            }

            // Add the variable
            parts.push({
                content: match[1],
                isVariable: true,
            });

            lastIndex = match.index + match[1].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push({
                content: text.substring(lastIndex),
                isVariable: false,
            });
        }

        return parts;
    }

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

    function closeAndFocusTrigger() {
        open = false;
        tick().then(() => {
            if (inputElement?.focus) {
                inputElement.focus();
            }
        });
    }

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const inputValue = target.value;
        const newCursorPosition = target.selectionStart || 0;

        if (inputValue === value && newCursorPosition === cursorPosition)
            return;

        value = inputValue;
        cursorPosition = newCursorPosition;

        const textBeforeCursor = inputValue.substring(
            Math.max(0, cursorPosition - 50),
            cursorPosition,
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

    function insertVariable(variableName: string) {
        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);

        const matchIndex = textBeforeCursor.lastIndexOf("{{");
        if (matchIndex === -1) return;

        const beforePattern = textBeforeCursor.substring(0, matchIndex);
        const replacement = `{{${variableName}}}`;

        value = beforePattern + replacement + textAfterCursor;
        const newCursorPos = beforePattern.length + replacement.length;

        closeAndFocusTrigger();

        tick().then(() => {
            let domElement: HTMLElement | null = null;

            // Try to get the actual input element from the Input component
            if (inputElement) {
                // Check if it's a direct HTMLInputElement
                if (inputElement.focus) {
                    domElement = inputElement;
                } else {
                    // Try common component element properties
                    domElement =
                        inputElement.$el ||
                        inputElement.getElement?.() ||
                        inputElement.element ||
                        null;
                }
            }

            // Fallback to getElementById if we still don't have an element
            if (!domElement && fieldId) {
                domElement = document.getElementById(
                    fieldId,
                ) as HTMLInputElement | null;
            }

            if (
                domElement &&
                "focus" in domElement &&
                "setSelectionRange" in domElement
            ) {
                (domElement as HTMLInputElement).focus();
                (domElement as HTMLInputElement).setSelectionRange(
                    newCursorPos,
                    newCursorPos,
                );
            }
        });
    }
</script>

<div class="relative">
    {#if hasPrefix || hasSuffix}
        <div class="relative w-full">
            <!-- Background overlay with colored variables -->
            <div
                bind:this={overlayElement}
                class={cn(
                    "absolute inset-0 pointer-events-none z-0",
                    "flex items-center px-3 py-2",
                    "text-sm font-[inherit] whitespace-pre overflow-hidden",
                    hasPrefix && "ps-9",
                    hasSuffix && "pe-9"
                )}
            >
                {#each parseTextWithVariables(value) as part}
                    <span class={part.isVariable ? "text-primary" : "text-transparent"}>
                        {part.content}
                    </span>
                {/each}
            </div>

            <!-- Transparent input field -->
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
                class={cn(inputClasses, "bg-transparent text-transparent caret-foreground relative z-10")}
                bind:value
                oninput={handleInput}
                onkeydown={handleKeydown}
            />

            <!-- Regular text overlay (for non-variable text) -->
            <div
                class={cn(
                    "absolute inset-0 pointer-events-none z-5",
                    "flex items-center px-3 py-2",
                    "text-sm font-[inherit] whitespace-pre overflow-hidden text-foreground",
                    hasPrefix && "ps-9",
                    hasSuffix && "pe-9"
                )}
            >
                {#each parseTextWithVariables(value) as part}
                    <span class={part.isVariable ? "text-transparent" : "text-foreground"}>
                        {part.content}
                    </span>
                {/each}
            </div>

            {#if hasPrefix}
                <div
                    class="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50 z-20"
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
                    class="text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 peer-disabled:opacity-50 z-20"
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
        <div class="relative">
            <!-- Background overlay with colored variables -->
            <div
                bind:this={overlayElement}
                class="absolute inset-0 pointer-events-none z-0 flex items-center px-3 py-2 text-sm font-[inherit] whitespace-pre overflow-hidden"
            >
                {#each parseTextWithVariables(value) as part}
                    <span class={part.isVariable ? "text-primary" : "text-transparent"}>
                        {part.content}
                    </span>
                {/each}
            </div>

            <!-- Transparent input field -->
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
                class="bg-transparent text-transparent caret-foreground relative z-10"
                bind:value
                oninput={handleInput}
                onkeydown={handleKeydown}
            />

            <!-- Regular text overlay (for non-variable text) -->
            <div
                class="absolute inset-0 pointer-events-none z-5 flex items-center px-3 py-2 text-sm font-[inherit] whitespace-pre overflow-hidden text-foreground"
            >
                {#each parseTextWithVariables(value) as part}
                    <span class={part.isVariable ? "text-transparent" : "text-foreground"}>
                        {part.content}
                    </span>
                {/each}
            </div>
        </div>
    {/if}

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
