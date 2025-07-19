<script lang="ts">
    import type { FormData, TranslationData } from '../types';
    import { RenderMode } from '../types';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
    import FilamentTabsRenderer from './FilamentTabsRenderer.svelte';
    import MixedSchemaRenderer from './MixedSchemaRenderer.svelte';
    import DefaultRenderer from './DefaultRenderer.svelte';
    import GridLayout from '../layouts/GridLayout.svelte';
    import TabsLayout from '../layouts/TabsLayout.svelte';
    import { 
        usesFilamentTabs, 
        usesMixedSchema,
        getTranslatableFields,
        getRepeatableFieldsWithTranslatableContent
    } from '../utils/formHelpers';
    import { CSS_CLASSES, SCHEMA_TYPES } from '../constants';
    import { CMS_LOCALE } from '@/lib/shared/env';
    
    export let componentInstance: any;
    export let formData: FormData;
    export let translationData: TranslationData = {};
    export let locales: readonly { code: string; name: string; }[] = [];
    
    // Check if this component has translatable content
    $: regularTranslatableFields = getTranslatableFields(componentInstance.component.schema);
    $: repeatableFieldsWithTranslatableContent = getRepeatableFieldsWithTranslatableContent(componentInstance.component.schema);
    $: hasTranslatableContent = regularTranslatableFields.length > 0 || repeatableFieldsWithTranslatableContent.length > 0;
    
    let activeLocale = locales.find(l => l.code !== CMS_LOCALE)?.code || locales[0]?.code || '';
    
    // Create a proxy formData that binds to translation data for the active locale
    $: translationFormData = activeLocale === CMS_LOCALE 
        ? formData[componentInstance.id] || {}
        : translationData[componentInstance.id]?.[activeLocale] || {};
</script>

{#if hasTranslatableContent}
    <div class="border rounded-lg p-4 bg-muted/30">
        <div class="mb-4">
            <h4 class="text-sm font-medium text-muted-foreground mb-2">Translation Mode</h4>
            <Tabs bind:value={activeLocale} class="w-full">
                <TabsList class="grid w-full" style="grid-template-columns: repeat({locales.length}, minmax(0, 1fr));">
                    {#each locales as locale}
                        <TabsTrigger value={locale.code} class="text-xs">
                            {locale.name}
                            {#if locale.code === CMS_LOCALE}
                                <span class="ml-1 text-xs opacity-60">(default)</span>
                            {/if}
                        </TabsTrigger>
                    {/each}
                </TabsList>
                
                {#each locales as locale}
                    <TabsContent value={locale.code} class="mt-4">
                        <!-- Render the component content using the same logic but with translation mode and proper data binding -->
                        {#if usesFilamentTabs(componentInstance.component)}
                            {@const schema = Array.isArray(componentInstance.component.schema) ? componentInstance.component.schema : []}
                            <FilamentTabsRenderer 
                                {schema}
                                componentId={componentInstance.id}
                                formData={locale.code === CMS_LOCALE ? formData[componentInstance.id] : translationData[componentInstance.id]?.[locale.code] || {}}
                                mode={RenderMode.TRANSLATION}
                                currentLocale={locale.code}
                                isDefaultLocale={locale.code === CMS_LOCALE}
                                {translationData}
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
                                formData={locale.code === CMS_LOCALE ? formData[componentInstance.id] : translationData[componentInstance.id]?.[locale.code] || {}}
                                mode={RenderMode.TRANSLATION}
                                currentLocale={locale.code}
                                isDefaultLocale={locale.code === CMS_LOCALE}
                                {translationData}
                            />

                        {:else if !Array.isArray(componentInstance.component.schema)}
                            {#if componentInstance.component.schema.type === SCHEMA_TYPES.GRID}
                                <GridLayout 
                                    layout={componentInstance.component.schema}
                                    formData={locale.code === CMS_LOCALE ? formData[componentInstance.id] : translationData[componentInstance.id]?.[locale.code] || {}}
                                    componentId={componentInstance.id}
                                    mode={RenderMode.TRANSLATION}
                                    currentLocale={locale.code}
                                    isDefaultLocale={locale.code === CMS_LOCALE}
                                    {translationData}
                                />
                            {:else if componentInstance.component.schema.type === SCHEMA_TYPES.TABS}
                                <TabsLayout 
                                    layout={componentInstance.component.schema}
                                    formData={locale.code === CMS_LOCALE ? formData[componentInstance.id] : translationData[componentInstance.id]?.[locale.code] || {}}
                                    componentId={componentInstance.id}
                                    mode={RenderMode.TRANSLATION}
                                    currentLocale={locale.code}
                                    isDefaultLocale={locale.code === CMS_LOCALE}
                                    {translationData}
                                />
                            {/if}

                        {:else}
                            <DefaultRenderer 
                                schema={componentInstance.component.schema}
                                componentId={componentInstance.id}
                                formData={locale.code === CMS_LOCALE ? formData[componentInstance.id] : translationData[componentInstance.id]?.[locale.code] || {}}
                                mode={RenderMode.TRANSLATION}
                                currentLocale={locale.code}
                                isDefaultLocale={locale.code === CMS_LOCALE}
                                {translationData}
                            />
                        {/if}
                    </TabsContent>
                {/each}
            </Tabs>
        </div>
    </div>
{:else}
    <div class="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/10">
        This component has no translatable fields.
    </div>
{/if}