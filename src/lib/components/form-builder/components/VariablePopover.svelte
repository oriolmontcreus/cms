<script lang="ts">
    import { cn } from "$lib/utils";
    import * as Command from "@components/ui/command";
    import * as Popover from "@components/ui/popover";
    import { IconVariable } from "@tabler/icons-svelte";
    import ScrollArea from "../../ui/scroll-area/scroll-area.svelte";
    import type { VariablePopoverState } from "../composables/useVariablePopover";
    import type { Writable } from "svelte/store";
    import { onMount, onDestroy } from "svelte";

    export let popoverState: Writable<VariablePopoverState>;
    export let globalVariablesData: Record<string, any>;
    export let onVariableSelect: (variable: string) => void;

    $: ({ open, searchQuery, selectedIndex, filteredVariables } =
        $popoverState);

    // Handle popover close from outside click
    function handleOpenChange(newOpen: boolean) {
        if (!newOpen) {
            popoverState.update((s) => ({
                ...s,
                open: false,
                searchQuery: "",
                selectedIndex: -1,
            }));
        }
    }

    // Additional outside click handler
    function handleOutsideClick(event: MouseEvent) {
        if (open) {
            popoverState.update((s) => ({
                ...s,
                open: false,
                searchQuery: "",
                selectedIndex: -1,
            }));
        }
    }

    onMount(() => {
        document.addEventListener("click", handleOutsideClick, true);
    });

    onDestroy(() => {
        document.removeEventListener("click", handleOutsideClick, true);
    });
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
    <Popover.Trigger
        class="absolute opacity-0 pointer-events-none"
        tabindex={-1}
    >
        <button type="button" aria-hidden="true"></button>
    </Popover.Trigger>

    <Popover.Content class="w-80 p-0 -mt-5" align="start">
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
                            {Object.keys(globalVariablesData).length === 0
                                ? "No global variables loaded."
                                : "No variables match your search."}
                        </Command.Empty>
                    {:else}
                        <Command.Group heading="Global Variables">
                            {#each filteredVariables as varName, index (varName)}
                                <Command.Item
                                    value={varName}
                                    onSelect={() => onVariableSelect(varName)}
                                    class={cn(
                                        "flex items-center gap-2 cursor-pointer",
                                        index === selectedIndex &&
                                            selectedIndex >= 0 &&
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
