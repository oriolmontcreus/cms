<script lang="ts">
    import type { FormData, TranslationData } from "../types";
    import { RenderMode } from "../types";
    import UnifiedRenderer from "./UnifiedRenderer.svelte";
    import TranslationModeWrapper from "./TranslationModeWrapper.svelte";
    import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
    import GridLayout from "../layouts/GridLayout.svelte";
    import TabsLayout from "../layouts/TabsLayout.svelte";
    import {
        usesFilamentTabsOptimized,
        usesMixedSchemaOptimized,
        getComponentAnalysis,
    } from "../utils/optimizedSchemaProcessor";
    import { CSS_CLASSES, SCHEMA_TYPES } from "../constants";

    export let componentInstance: any;
    export let formData: FormData;
    export let mode: RenderMode = RenderMode.CONTENT;
    export let translationData: TranslationData = {};
    export let locales: readonly { code: string; name: string }[] = [];
    export let isCollapsed: boolean = true;
    export let onToggleCollapse: () => void;
</script>

<div
    class="{CSS_CLASSES.COMPONENT_CONTAINER} {isCollapsed
        ? 'cursor-pointer hover:bg-accent dark:hover:bg-accent transition-all duration-200'
        : ''}"
    onclick={isCollapsed ? onToggleCollapse : undefined}
    role={isCollapsed ? "button" : undefined}
    onkeydown={isCollapsed
        ? (e) => (e.key === "Enter" || e.key === " ") && onToggleCollapse()
        : undefined}
    aria-label={isCollapsed ? "Click to expand component" : undefined}
>
    <div class="flex items-center justify-between">
        <h3 class={CSS_CLASSES.COMPONENT_TITLE}>
            {componentInstance.displayName || componentInstance.component.name}
        </h3>
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
    </div>

    <div
        class="overflow-hidden transition-all duration-300 ease-in-out {isCollapsed
            ? 'max-h-0 opacity-0'
            : 'max-h-[2000px] opacity-100'}"
    >
        <div>
            {#if mode === RenderMode.TRANSLATION}
                <TranslationModeWrapper
                    {componentInstance}
                    {formData}
                    {translationData}
                    {locales}
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
                />
            {/if}
        </div>
    </div>
</div>
