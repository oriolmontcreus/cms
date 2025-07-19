<script lang="ts">
    import type { FormData, TranslationData } from '../types';
    import { RenderMode } from '../types';
    import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
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
    
    // Handle locale selection
    function handleLocaleChange(newLocale: string | undefined) {
        if (newLocale) {
            activeLocale = newLocale;
        }
    }
    
    // Create a proxy formData that handles both regular fields and repeatable field translations
    function getFormDataForLocale(locale: string) {
        if (locale === CMS_LOCALE) {
            return formData[componentInstance.id] || {};
        }
        
        // For non-default locales, we need to create a merged data structure
        // that combines content data (for structure) with translation data (for values)
        const contentData = formData[componentInstance.id] || {};
        const localeTranslationData = translationData[componentInstance.id]?.[locale] || {};
        const mergedData = { ...contentData };
        
        // Handle regular translatable fields
        regularTranslatableFields.forEach(field => {
            if (field.type !== 'repeatable' && localeTranslationData[field.name] !== undefined) {
                mergedData[field.name] = localeTranslationData[field.name];
            }
        });
        
        // Handle repeatable fields with special translation keys
        repeatableFieldsWithTranslatableContent.forEach(repeatableField => {
            const repeatableItems = contentData[repeatableField.name] || [];
            if (Array.isArray(repeatableItems)) {
                const translatedItems = repeatableItems.map((item, itemIndex) => {
                    const translationKey = `${repeatableField.name}_${itemIndex}`;
                    const itemTranslations = localeTranslationData[translationKey] || {};
                    
                    // Merge content item with its translations
                    return { ...item, ...itemTranslations };
                });
                mergedData[repeatableField.name] = translatedItems;
            }
        });
        
        return mergedData;
    }
</script>

{#if hasTranslatableContent}
    <div class="border rounded-lg p-4 bg-muted/30">
        <div class="mb-4">
            <h4 class="text-sm font-medium text-muted-foreground mb-2">Translation Mode</h4>
            <div class="w-48">
                <Select 
                    type="single"
                    value={activeLocale}
                    onValueChange={handleLocaleChange}
                >
                    <SelectTrigger class="w-full">
                        {#if activeLocale}
                            {@const currentLocale = locales.find(l => l.code === activeLocale)}
                            <span class="flex items-center gap-2">
                                {currentLocale?.name || 'Select Language'}
                                {#if activeLocale === CMS_LOCALE}
                                    <span class="text-xs opacity-60">(default)</span>
                                {/if}
                            </span>
                        {:else}
                            <span>Select Language</span>
                        {/if}
                    </SelectTrigger>
                    <SelectContent>
                        {#each locales as locale}
                            <SelectItem value={locale.code} label={locale.name}>
                                <span class="flex items-center gap-2">
                                    {locale.name}
                                    {#if locale.code === CMS_LOCALE}
                                        <span class="text-xs opacity-60">(default)</span>
                                    {/if}
                                </span>
                            </SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        <div class="mt-4">
            <!-- Render the component content using the same logic but with translation mode and proper data binding -->
            {#if usesFilamentTabs(componentInstance.component)}
                {@const schema = Array.isArray(componentInstance.component.schema) ? componentInstance.component.schema : []}
                <FilamentTabsRenderer 
                    {schema}
                    componentId={componentInstance.id}
                    formData={getFormDataForLocale(activeLocale)}
                    mode={RenderMode.TRANSLATION}
                    currentLocale={activeLocale}
                    isDefaultLocale={activeLocale === CMS_LOCALE}
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
                    formData={getFormDataForLocale(activeLocale)}
                    mode={RenderMode.TRANSLATION}
                    currentLocale={activeLocale}
                    isDefaultLocale={activeLocale === CMS_LOCALE}
                    {translationData}
                />

            {:else if !Array.isArray(componentInstance.component.schema)}
                {#if componentInstance.component.schema.type === SCHEMA_TYPES.GRID}
                    <GridLayout 
                        layout={componentInstance.component.schema}
                        formData={getFormDataForLocale(activeLocale)}
                        componentId={componentInstance.id}
                        mode={RenderMode.TRANSLATION}
                        currentLocale={activeLocale}
                        isDefaultLocale={activeLocale === CMS_LOCALE}
                        {translationData}
                    />
                {:else if componentInstance.component.schema.type === SCHEMA_TYPES.TABS}
                    <TabsLayout 
                        layout={componentInstance.component.schema}
                        formData={getFormDataForLocale(activeLocale)}
                        componentId={componentInstance.id}
                        mode={RenderMode.TRANSLATION}
                        currentLocale={activeLocale}
                        isDefaultLocale={activeLocale === CMS_LOCALE}
                        {translationData}
                    />
                {/if}

            {:else}
                <DefaultRenderer 
                    schema={componentInstance.component.schema}
                    componentId={componentInstance.id}
                    formData={getFormDataForLocale(activeLocale)}
                    mode={RenderMode.TRANSLATION}
                    currentLocale={activeLocale}
                    isDefaultLocale={activeLocale === CMS_LOCALE}
                    {translationData}
                />
            {/if}
        </div>
    </div>
{:else}
    <div class="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/10">
        This component has no translatable fields.
    </div>
{/if}