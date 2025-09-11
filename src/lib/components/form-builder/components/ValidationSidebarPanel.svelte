<script lang="ts">
    import type { ValidationError } from "../utils/validation";
    import { Button } from "@components/ui/button";
    import { Badge } from "@components/ui/badge";
    import { ScrollArea } from "@components/ui/scroll-area";
    import { Separator } from "@components/ui/separator";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import {
        IconAlertCircle,
        IconChevronDown,
        IconChevronUp,
        IconCheck,
        IconArrowDown,
        IconArrowUp,
        IconExternalLink,
    } from "@tabler/icons-svelte";
    import { cn } from "$lib/utils";
    import { createEventDispatcher } from "svelte";
    import { slide } from "svelte/transition";

    export let errors: ValidationError[] = [];
    export let isVisible: boolean = false;
    export let totalErrors: number = 0;
    export let fixedErrors: number = 0;

    const dispatch = createEventDispatcher<{
        navigateToError: { error: ValidationError };
        nextError: void;
        previousError: void;
    }>();

    let isCollapsed = false;
    let currentErrorIndex = 0;

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
    $: currentError = errors[currentErrorIndex];
    $: allErrorsFixed =
        totalErrors > 0 && fixedErrors === totalErrors && errors.length === 0;

    function navigateToError(error: ValidationError) {
        dispatch("navigateToError", { error });
    }

    function nextError() {
        if (errors.length > 0) {
            currentErrorIndex = (currentErrorIndex + 1) % errors.length;
            dispatch("nextError");
            navigateToError(currentError);
        }
    }

    function previousError() {
        if (errors.length > 0) {
            currentErrorIndex =
                currentErrorIndex > 0
                    ? currentErrorIndex - 1
                    : errors.length - 1;
            dispatch("previousError");
            navigateToError(currentError);
        }
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

    function getErrorBadgeVariant(
        error: ValidationError,
    ): "default" | "secondary" | "destructive" | "outline" {
        if (error.isInRepeater) return "secondary";
        if (error.tabName) return "outline";
        return "default";
    }
</script>

{#if isVisible}
    <Sidebar.Group>
        <Sidebar.GroupLabel class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                {#if allErrorsFixed}
                    <IconCheck size={16} class="text-green-500" />
                    <span class="text-green-600">Validation</span>
                {:else}
                    <IconAlertCircle size={16} class="text-destructive" />
                    <span>Validation</span>
                {/if}
                {#if hasErrors}
                    <Badge
                        variant={allErrorsFixed ? "secondary" : "destructive"}
                        class="text-xs"
                    >
                        {errors.length}
                    </Badge>
                {/if}
            </div>
            <Button
                variant="ghost"
                size="sm"
                class="h-6 w-6 p-0"
                onclick={toggleCollapsed}
                title={isCollapsed ? "Expand" : "Collapse"}
            >
                {#if isCollapsed}
                    <IconChevronDown size={14} />
                {:else}
                    <IconChevronUp size={14} />
                {/if}
            </Button>
        </Sidebar.GroupLabel>

        {#if !isCollapsed}
            <div transition:slide={{ duration: 200 }}>
                <Sidebar.GroupContent>
                    {#if allErrorsFixed}
                        <!-- Success state -->
                        <div
                            class="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                        >
                            <div class="flex items-center gap-2">
                                <IconCheck size={16} class="text-green-500" />
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
                        <!-- Progress Bar -->
                        {#if totalErrors > 0}
                            <div class="px-1 pb-3">
                                <div
                                    class="flex items-center justify-between text-xs text-muted-foreground mb-1"
                                >
                                    <span>Progress</span>
                                    <span
                                        >{fixedErrors}/{totalErrors} fixed</span
                                    >
                                </div>
                                <div class="w-full bg-muted rounded-full h-2">
                                    <div
                                        class="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        style="width: {progress}%"
                                    ></div>
                                </div>
                            </div>
                        {/if}

                        <!-- Navigation Controls -->
                        {#if errors.length > 1}
                            <div class="px-1 pb-2">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs text-muted-foreground">
                                        Error {currentErrorIndex + 1} of {errors.length}
                                    </span>
                                    <div class="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="h-6 px-2 text-xs"
                                            onclick={previousError}
                                            disabled={errors.length <= 1}
                                            title="Previous Error"
                                        >
                                            <IconArrowUp size={12} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="h-6 px-2 text-xs"
                                            onclick={nextError}
                                            disabled={errors.length <= 1}
                                            title="Next Error"
                                        >
                                            <IconArrowDown size={12} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <Separator class="mb-2" />

                        <!-- Error List -->
                        <ScrollArea class="max-h-64">
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
                                            <Badge
                                                variant="secondary"
                                                class="text-xs"
                                            >
                                                {group.errors.length}
                                            </Badge>
                                        </div>

                                        <!-- Component Errors -->
                                        <div class="space-y-2 ml-2">
                                            {#each group.errors as error (error.field)}
                                                <div
                                                    class={cn(
                                                        "p-2 rounded-md border bg-card hover:bg-accent transition-colors cursor-pointer text-xs",
                                                        currentError ===
                                                            error &&
                                                            "ring-1 ring-ring",
                                                    )}
                                                    onclick={() =>
                                                        navigateToError(error)}
                                                    onkeydown={(e) =>
                                                        e.key === "Enter" &&
                                                        navigateToError(error)}
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
                                                                <Badge
                                                                    variant={getErrorBadgeVariant(
                                                                        error,
                                                                    )}
                                                                    class="text-xs shrink-0"
                                                                >
                                                                    {error.tabName ||
                                                                        "Field"}
                                                                </Badge>
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
{/if}
