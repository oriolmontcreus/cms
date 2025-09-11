<script lang="ts">
    import type { ValidationError } from "../utils/validation";
    import { ScrollArea } from "@components/ui/scroll-area";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import {
        IconAlertCircle,
        IconChevronDown,
        IconChevronUp,
        IconCheck,
        IconExternalLink,
    } from "@tabler/icons-svelte";
    import { cn } from "$lib/utils";
    import { createEventDispatcher } from "svelte";
    import { slide, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    export let errors: ValidationError[] = [];
    export let isVisible: boolean = false;
    export let totalErrors: number = 0;
    export let fixedErrors: number = 0;

    const dispatch = createEventDispatcher<{
        navigateToError: { error: ValidationError };
    }>();

    let isCollapsed = false;

    // Group errors by component
    $: groupedErrors = errors.reduce(
        (groups, error) => {
            const key = error.componentId || "unknown";
            if (!groups[key]) {
                groups[key] = {
                    componentId: key,
                    componentLabel: error.componentLabel || "Unknown Component",
                    errors: [],
                };
            }
            groups[key].errors.push(error);
            return groups;
        },
        {} as Record<
            string,
            {
                componentId: string;
                componentLabel: string;
                errors: ValidationError[];
            }
        >,
    );

    $: groupedErrorsList = Object.values(groupedErrors);
    $: progress = totalErrors > 0 ? (fixedErrors / totalErrors) * 100 : 0;
    $: hasErrors = errors.length > 0;
    $: allErrorsFixed =
        totalErrors > 0 && fixedErrors === totalErrors && errors.length === 0;

    function navigateToError(error: ValidationError) {
        dispatch("navigateToError", { error });
    }

    function toggleCollapsed() {
        isCollapsed = !isCollapsed;
    }

    function getErrorDescription(error: ValidationError): string {
        let description = error.label;

        if (error.isInRepeater && error.repeaterIndex !== undefined) {
            description += ` (Item ${error.repeaterIndex + 1})`;
        }

        if (error.tabName) {
            description += ` in ${error.tabName}`;
        }

        return description;
    }
</script>

{#if isVisible}
    <div
        transition:fly={{ y: 20, duration: 300, easing: quintOut }}
        class="validation-sidebar-panel"
    >
        <Sidebar.Group>
            <Sidebar.GroupLabel
                class="cursor-pointer hover:bg-accent/50 transition-colors rounded-md p-2 py-6"
                onclick={toggleCollapsed}
                onkeydown={(e) => e.key === "Enter" && toggleCollapsed()}
                role="button"
                tabindex={0}
                title={isCollapsed ? "Expand" : "Collapse"}
            >
                <div class="w-full">
                    <!-- Header row with icon, title, count, and chevron -->
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                            {#if allErrorsFixed}
                                <IconCheck size={16} class="text-green-500" />
                                <span class="text-green-600">Validation</span>
                            {:else}
                                <IconAlertCircle
                                    size={16}
                                    class="text-destructive"
                                />
                                <span>Validation</span>
                            {/if}
                            <span class="text-muted-foreground text-xs"
                                >{fixedErrors}/{totalErrors} fixed</span
                            >
                        </div>
                        <div class="shrink-0">
                            {#if isCollapsed}
                                <IconChevronDown size={14} />
                            {:else}
                                <IconChevronUp size={14} />
                            {/if}
                        </div>
                    </div>

                    <!-- Progress Bar - Always visible -->
                    {#if totalErrors > 0}
                        <div class="mt-2 w-full">
                            <div class="w-full bg-primary/20 rounded-full h-1">
                                <div
                                    class="bg-green-500 h-1 rounded-full transition-all duration-300"
                                    style="width: {progress}%"
                                ></div>
                            </div>
                        </div>
                    {/if}
                </div>
            </Sidebar.GroupLabel>

            {#if !isCollapsed}
                <div transition:slide={{ duration: 200 }}>
                    <Sidebar.GroupContent>
                        {#if allErrorsFixed}
                            <!-- Success state -->
                            <div
                                class="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 mt-2"
                            >
                                <div class="flex items-center gap-2">
                                    <IconCheck
                                        size={16}
                                        class="text-green-500"
                                    />
                                    <span
                                        class="text-sm font-medium text-green-700 dark:text-green-300"
                                    >
                                        All errors fixed!
                                    </span>
                                </div>
                                <p
                                    class="text-xs text-green-600 dark:text-green-400 mt-1"
                                >
                                    Your form is ready to save.
                                </p>
                            </div>
                        {:else if hasErrors}
                            <!-- Error List -->
                            <ScrollArea class="max-h-64 mt-4">
                                <div class="space-y-3">
                                    {#each groupedErrorsList as group (group.componentId)}
                                        <div class="space-y-2">
                                            <!-- Component Header -->
                                            <div
                                                class="flex items-center gap-2 px-1"
                                            >
                                                <h4
                                                    class="font-medium text-xs text-muted-foreground"
                                                >
                                                    {group.componentLabel}
                                                </h4>
                                                <span class="text-xs"
                                                    >{group.errors.length}</span
                                                >
                                            </div>

                                            <!-- Component Errors -->
                                            <div
                                                class="flex flex-col gap-2 my-1 mx-1"
                                            >
                                                {#each group.errors as error (error.field)}
                                                    <div
                                                        class={cn(
                                                            "p-2 rounded-md border bg-card hover:bg-accent cursor-pointer text-xs focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-all ease-in-out duration-200",
                                                        )}
                                                        onclick={() =>
                                                            navigateToError(
                                                                error,
                                                            )}
                                                        onkeydown={(e) =>
                                                            e.key === "Enter" &&
                                                            navigateToError(
                                                                error,
                                                            )}
                                                        role="button"
                                                        tabindex="0"
                                                    >
                                                        <div
                                                            class="flex items-start justify-between gap-2"
                                                        >
                                                            <div
                                                                class="flex-1 min-w-0"
                                                            >
                                                                <div
                                                                    class="flex items-center gap-2 mb-1"
                                                                >
                                                                    <span
                                                                        class="font-medium text-xs truncate"
                                                                    >
                                                                        {getErrorDescription(
                                                                            error,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <p
                                                                    class="text-xs text-destructive"
                                                                >
                                                                    {error.message}
                                                                </p>
                                                                {#if error.isInRepeater && error.repeaterIndex !== undefined}
                                                                    <p
                                                                        class="text-xs text-muted-foreground mt-1"
                                                                    >
                                                                        Repeater
                                                                        item {error.repeaterIndex +
                                                                            1}
                                                                    </p>
                                                                {/if}
                                                            </div>
                                                            <IconExternalLink
                                                                size={12}
                                                                class="text-muted-foreground shrink-0"
                                                            />
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </ScrollArea>
                        {/if}
                    </Sidebar.GroupContent>
                </div>
            {/if}
        </Sidebar.Group>
    </div>
{/if}

<style>
    .validation-sidebar-panel {
        /* Smooth opacity transitions for better visual flow */
        opacity: 1;
        transform: translateY(0);
    }

    /* Additional smooth transitions for interactive elements */
    :global(.validation-sidebar-panel .hover\\:bg-accent) {
        transition:
            background-color 0.2s ease-in-out,
            transform 0.1s ease-in-out;
    }

    :global(.validation-sidebar-panel .hover\\:bg-accent:hover) {
        transform: translateY(-1px);
    }
</style>
