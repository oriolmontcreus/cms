<script lang="ts">
    import type { FormData, TranslationData } from "../types";
    import { RenderMode } from "../types";
    import UnifiedRenderer from "./UnifiedRenderer.svelte";
    import TranslationModeWrapper from "./TranslationModeWrapper.svelte";
    import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
    import { CSS_CLASSES } from "../constants";

    export let componentInstance: any;
    export let formData: FormData;
    export let mode: RenderMode = RenderMode.CONTENT;
    export let translationData: TranslationData = {};
    export let locales: readonly { code: string; name: string }[] = [];
    export let isCollapsed: boolean = true;
    export let disableCollapsible: boolean = false;
    export let hideComponentTitles: boolean = false;
    export let onToggleCollapse: () => void;
    export let validationErrors: Record<string, string> = {};
</script>

<div
    class="{CSS_CLASSES.COMPONENT_CONTAINER} {isCollapsed && !disableCollapsible
        ? 'cursor-pointer border hover:bg-accent dark:hover:bg-accent transition-all duration-200'
        : ''}"
    onclick={isCollapsed && !disableCollapsible ? onToggleCollapse : undefined}
    role={isCollapsed && !disableCollapsible ? "button" : undefined}
    onkeydown={isCollapsed && !disableCollapsible
        ? (e) => (e.key === "Enter" || e.key === " ") && onToggleCollapse()
        : undefined}
    aria-label={isCollapsed && !disableCollapsible
        ? "Click to expand component"
        : undefined}
>
    {#if !hideComponentTitles}
        <div class="flex items-center justify-between">
            <h3 class={CSS_CLASSES.COMPONENT_TITLE}>
                {componentInstance.displayName ||
                    componentInstance.component.name}
            </h3>
            {#if !disableCollapsible}
                {#if !isCollapsed}
                    <button
                        class="flex items-center justify-center h-6 w-6 transition-all cursor-pointer duration-200 ease-in-out hover:bg-accent rounded rotate-180"
                        onclick={(e) => {
                            e.stopPropagation();
                            onToggleCollapse();
                        }}
                        aria-label="Collapse component"
                    >
                        <ChevronDownIcon class="h-4 w-4 text-gray-500" />
                    </button>
                {:else}
                    <div
                        class="flex items-center justify-center h-6 w-6 transition-transform duration-200 opacity-60"
                    >
                        <ChevronDownIcon class="h-4 w-4 text-gray-500" />
                    </div>
                {/if}
            {/if}
        </div>
    {/if}

    <div
        class="overflow-hidden transition-all duration-300 ease-in-out {disableCollapsible ||
        !isCollapsed
            ? 'max-h-none opacity-100'
            : 'max-h-0 opacity-0'}"
    >
        <div>
            {#if mode === RenderMode.TRANSLATION}
                <TranslationModeWrapper
                    {componentInstance}
                    {formData}
                    {translationData}
                    {locales}
                    {validationErrors}
                />
            {:else}
                <!-- Use unified renderer for all schema types -->
                {@const schema = Array.isArray(
                    componentInstance.component.schema,
                )
                    ? componentInstance.component.schema
                    : []}

                <UnifiedRenderer
                    {schema}
                    componentId={componentInstance.id}
                    formData={formData[componentInstance.id]}
                    {mode}
                    {validationErrors}
                />
            {/if}
        </div>
    </div>
</div>
