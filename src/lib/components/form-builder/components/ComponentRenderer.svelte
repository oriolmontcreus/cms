<script lang="ts">
    import type { FormData, TranslationData } from '../types';
    import { RenderMode } from '../types';
    import FilamentTabsRenderer from './FilamentTabsRenderer.svelte';
    import MixedSchemaRenderer from './MixedSchemaRenderer.svelte';
    import DefaultRenderer from './DefaultRenderer.svelte';
    import GridLayout from '../layouts/GridLayout.svelte';
    import TabsLayout from '../layouts/TabsLayout.svelte';
    import TranslationModeWrapper from './TranslationModeWrapper.svelte';
    import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
    import { 
        usesFilamentTabs, 
        usesMixedSchema
    } from '../utils/formHelpers';
    import { CSS_CLASSES, SCHEMA_TYPES } from '../constants';
    
    export let componentInstance: any;
    export let formData: FormData;
    export let mode: RenderMode = RenderMode.CONTENT;
    export let translationData: TranslationData = {};
    export let locales: readonly { code: string; name: string; }[] = [];
    export let isCollapsed: boolean = true;
    export let onToggleCollapse: () => void;
</script>

<div 
    class="{CSS_CLASSES.COMPONENT_CONTAINER} {isCollapsed ? 'cursor-pointer hover:bg-accent dark:hover:bg-accent transition-all duration-200' : ''}"
    onclick={isCollapsed ? onToggleCollapse : undefined}
    role={isCollapsed ? "button" : undefined}
    onkeydown={isCollapsed ? (e) => (e.key === 'Enter' || e.key === ' ') && onToggleCollapse() : undefined}
    aria-label={isCollapsed ? 'Click to expand component' : undefined}
>
    <div class="flex items-center justify-between">
        <h3 class={CSS_CLASSES.COMPONENT_TITLE}>
            {componentInstance.displayName || componentInstance.component.name}
        </h3>
        {#if !isCollapsed}
            <button
                class="flex items-center justify-center h-6 w-6 transition-all cursor-pointer duration-200 ease-in-out hover:bg-accent rounded rotate-180"
                onclick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
                aria-label="Collapse component"
            >
                <ChevronDownIcon class="h-4 w-4 text-gray-500" />
            </button>
        {:else}
            <div class="flex items-center justify-center h-6 w-6 transition-transform duration-200 opacity-60">
                <ChevronDownIcon class="h-4 w-4 text-gray-500" />
            </div>
        {/if}
    </div>
    
    <div class="overflow-hidden transition-all duration-300 ease-in-out {isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}">
        <div>
            {#if mode === RenderMode.TRANSLATION}
                <TranslationModeWrapper 
                    {componentInstance}
                    {formData}
                    {translationData}
                    {locales}
                />
            {:else if usesFilamentTabs(componentInstance.component)}
                {@const schema = Array.isArray(componentInstance.component.schema) ? componentInstance.component.schema : []}
                <FilamentTabsRenderer 
                    {schema}
                    componentId={componentInstance.id}
                    formData={formData[componentInstance.id]}
                    {mode}
                />

            {:else if usesMixedSchema(componentInstance.component)}
                {@const schema = Array.isArray(componentInstance.component.schema) ? componentInstance.component.schema : []}
                {@const tabs = componentInstance.component.tabs || []}
                {@const activeTab = componentInstance.component.activeTab || tabs[0]?.name || ''}
                <MixedSchemaRenderer 
                    {schema}
                    {tabs}
                    {activeTab}
                    componentId={componentInstance.id}
                    formData={formData[componentInstance.id]}
                    {mode}
                />

            {:else if !Array.isArray(componentInstance.component.schema)}
                {#if componentInstance.component.schema.type === SCHEMA_TYPES.GRID}
                    <GridLayout 
                        layout={componentInstance.component.schema}
                        formData={formData[componentInstance.id]}
                        componentId={componentInstance.id}
                        {mode}
                    />
                {:else if componentInstance.component.schema.type === SCHEMA_TYPES.TABS}
                    <TabsLayout 
                        layout={componentInstance.component.schema}
                        formData={formData[componentInstance.id]}
                        componentId={componentInstance.id}
                        {mode}
                    />
                {/if}

            {:else}
                <DefaultRenderer 
                    schema={componentInstance.component.schema}
                    componentId={componentInstance.id}
                    formData={formData[componentInstance.id]}
                    {mode}
                />
            {/if}
        </div>
    </div>
</div> 