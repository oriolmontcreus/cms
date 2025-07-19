<script lang="ts">
    import type { FormData, TranslationData } from '../types';
    import { RenderMode } from '../types';
    import FilamentTabsRenderer from './FilamentTabsRenderer.svelte';
    import MixedSchemaRenderer from './MixedSchemaRenderer.svelte';
    import DefaultRenderer from './DefaultRenderer.svelte';
    import GridLayout from '../layouts/GridLayout.svelte';
    import TabsLayout from '../layouts/TabsLayout.svelte';
    import TranslationModeWrapper from './TranslationModeWrapper.svelte';
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
</script>

<div class={CSS_CLASSES.COMPONENT_CONTAINER}>
    <h3 class={CSS_CLASSES.COMPONENT_TITLE}>
        {componentInstance.displayName || componentInstance.component.name}
    </h3>
    
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