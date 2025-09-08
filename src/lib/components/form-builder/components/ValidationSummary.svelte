<script lang="ts">
    import type { ValidationError } from "../utils/validation";
    import { Button } from "@components/ui/button";
    import { Badge } from "@components/ui/badge";
    import { ScrollArea } from "@components/ui/scroll-area";
    import { Separator } from "@components/ui/separator";
    import {
        IconAlertCircle,
        IconChevronDown,
        IconChevronUp,
        IconX,
        IconExternalLink,
        IconCheck,
        IconArrowDown,
        IconArrowUp,
    } from "@tabler/icons-svelte";
    import { cn } from "$lib/utils";
    import { createEventDispatcher } from "svelte";
    import { slide, fade } from "svelte/transition";

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

    function togglePanel() {
        toggleCollapsed();
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

    // Keyboard shortcuts
    function handleKeydown(event: KeyboardEvent) {
        if (!isVisible) return;

        if (
            event.key === "ArrowDown" ||
            (event.ctrlKey && event.key === "j")
        ) {
            event.preventDefault();
            nextError();
        } else if (
            event.key === "ArrowUp" ||
            (event.ctrlKey && event.key === "k")
        ) {
            event.preventDefault();
            previousError();
        } else if (event.key === "Enter" && currentError) {
            event.preventDefault();
            navigateToError(currentError);
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible}
    <div
        class="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)]"
        transition:slide={{ duration: 200, axis: "y" }}
    >
        {#if allErrorsFixed}
            <!-- Success state - minimalistic green button -->
            <Button
                variant="default"
                class="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                onclick={togglePanel}
                title="All validation errors fixed!"
            >
                <IconCheck size={24} />
            </Button>
        {:else if isCollapsed}
            <!-- Collapsed state - red button with error count -->
            <Button
                variant="destructive"
                class="h-12 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 relative"
                onclick={togglePanel}
                title="Show validation errors"
            >
                <div class="flex items-center gap-2">
                    <IconAlertCircle size={20} />
                    <Badge
                        variant="secondary"
                        class="bg-white text-destructive-foreground text-sm font-medium"
                    >
                        {errors.length}
                    </Badge>
                </div>
            </Button>
        {:else}
            <!-- Expanded state - full panel -->
            <div
                class="w-96 bg-background border rounded-lg shadow-lg"
                transition:slide={{ duration: 200 }}
            >
                <!-- Header -->
                <div class="flex items-center justify-between p-4 pb-2">
                    <div class="flex items-center gap-2">
                        <IconAlertCircle size={20} class="text-destructive" />
                        <h3 class="font-semibold text-sm">Validation Errors</h3>
                        <Badge variant="destructive" class="text-xs">
                            {errors.length}
                        </Badge>
                    </div>
                    <div class="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-7 w-7 p-0"
                            onclick={toggleCollapsed}
                            title="Minimize"
                        >
                            <IconChevronDown size={16} />
                        </Button>
                    </div>
                </div>

                <!-- Progress Bar -->
                {#if totalErrors > 0}
                    <div class="px-4 pb-2">
                        <div
                            class="flex items-center justify-between text-xs text-muted-foreground mb-1"
                        >
                            <span>Progress</span>
                            <span>{fixedErrors}/{totalErrors} fixed</span>
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
                    <div class="px-4 pb-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-muted-foreground">
                                Error {currentErrorIndex + 1} of {errors.length}
                            </span>
                            <div class="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="h-7 px-2 text-xs"
                                    onclick={previousError}
                                    disabled={errors.length <= 1}
                                    title="Previous Error (↑ or Ctrl+K)"
                                >
                                    <IconArrowUp size={14} class="mr-1" />
                                    Prev
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="h-7 px-2 text-xs"
                                    onclick={nextError}
                                    disabled={errors.length <= 1}
                                    title="Next Error (↓ or Ctrl+J)"
                                >
                                    Next
                                    <IconArrowDown size={14} class="ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                {/if}

                <Separator />

                <!-- Error List -->
                <ScrollArea class="max-h-80">
                    <div class="p-4 space-y-4">
                        {#each groupedErrorsList as group (group.componentId)}
                            <div class="space-y-2">
                                <!-- Component Header -->
                                <div class="flex items-center gap-2">
                                    <h4
                                        class="font-medium text-sm text-muted-foreground"
                                    >
                                        {group.componentLabel}
                                    </h4>
                                    <Badge variant="secondary" class="text-xs">
                                        {group.errors.length}
                                    </Badge>
                                </div>

                                <!-- Component Errors -->
                                <div class="space-y-2 ml-2">
                                    {#each group.errors as error, index (error.field)}
                                        <div
                                            class={cn(
                                                "p-3 rounded-md border bg-card hover:bg-accent transition-colors cursor-pointer",
                                                currentError === error &&
                                                    "ring-2 ring-ring",
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
                                                <div class="flex-1 min-w-0">
                                                    <div
                                                        class="flex items-center gap-2 mb-1"
                                                    >
                                                        <span
                                                            class="font-medium text-sm truncate"
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
                                                        class="text-sm text-destructive"
                                                    >
                                                        {error.message}
                                                    </p>
                                                    {#if error.isInRepeater && error.repeaterIndex !== undefined}
                                                        <p
                                                            class="text-xs text-muted-foreground mt-1"
                                                        >
                                                            Repeater item {error.repeaterIndex +
                                                                1}
                                                        </p>
                                                    {/if}
                                                </div>
                                                <IconExternalLink
                                                    size={16}
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

                <Separator />

                <!-- Footer -->
                <div class="p-4 pt-2">
                    <div
                        class="flex items-center justify-between text-xs text-muted-foreground"
                    >
                        <span>
                            Click errors to navigate • Use ↑↓ or Ctrl+J/K
                        </span>
                    </div>
                </div>
            </div>
        {/if}
    </div>
{/if}

<style>
    :global([data-validation-target]) {
        scroll-margin-top: 120px;
    }

    /* Enhanced visual feedback for validation targets */
    :global([data-validation-target].highlight) {
        animation: validation-highlight 2s ease-out;
    }

    @keyframes validation-highlight {
        0% {
            box-shadow:
                0 0 0 2px hsl(var(--ring)),
                0 0 20px hsla(var(--ring), 0.3);
            transform: scale(1.02);
        }
        50% {
            box-shadow:
                0 0 0 4px hsl(var(--ring)),
                0 0 30px hsla(var(--ring), 0.2);
        }
        100% {
            box-shadow: none;
            transform: scale(1);
        }
    }

    /* Validation error badges on tabs */
    :global(.validation-error-badge) {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 8px;
        height: 8px;
        background: hsl(var(--destructive));
        border-radius: 50%;
        border: 2px solid hsl(var(--background));
    }

    /* Component error indicator */
    :global([data-component-id][data-has-errors="true"]) {
        border-left: 3px solid hsl(var(--destructive));
    }

    /* Pulse animation for urgent errors */
    .error-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }
</style>
