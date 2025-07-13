<script lang="ts">
    import type { FormData, TranslationData } from '../types';
    import { getTranslatableFields, getRepeatableFieldsWithTranslatableContent, getAllFields } from '../utils/formHelpers';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
    import FormField from '../FormField.svelte';
    import { CSS_CLASSES } from '../constants';
    import { CMS_LOCALE } from '@shared/env';
    
    export let componentInstance: any;
    export let translationData: TranslationData;
    export let locales: readonly { code: string; name: string; }[];
    export let formData: FormData;
    
    // Add execution counter
    let reactiveExecutionCount = 0;

    // Declare variables before using them in reactive statement
    let regularTranslatableFields: any[] = [];
    let repeatableFieldsWithTranslatableContent: any[] = [];
    let hasTranslatableContent = false;

    $: {
        console.log('[TranslationRenderer] Reactive computations executed', ++reactiveExecutionCount);
        regularTranslatableFields = getTranslatableFields(componentInstance.component.schema);
        repeatableFieldsWithTranslatableContent = getRepeatableFieldsWithTranslatableContent(componentInstance.component.schema);
        hasTranslatableContent = regularTranslatableFields.length > 0 || repeatableFieldsWithTranslatableContent.length > 0;
    }
    
    let activeLocale = locales[0]?.code || '';
    

</script>

{#if hasTranslatableContent}
    <div class="border rounded-lg p-4 bg-muted/30">
        
        <Tabs bind:value={activeLocale} class="w-full">
            <TabsList class="grid w-full grid-cols-{locales.length} mb-4">
                {#each locales as locale}
                    <TabsTrigger value={locale.code} class="text-xs">
                        {locale.name}
                    </TabsTrigger>
                {/each}
            </TabsList>
            
            {#each locales as locale}
                <TabsContent value={locale.code} class="space-y-4">
                    <!-- Regular translatable fields -->
                    {#each regularTranslatableFields as field}
                        {@const isActiveTab = locale.code === activeLocale}
                        {@const fieldForRendering = isActiveTab ? field : {...field, required: false}}
                        <div class="space-y-1">
                            <FormField 
                                field={fieldForRendering}
                                fieldId={`${componentInstance.id}-${locale.code}-${field.name}`}
                                bind:value={translationData[componentInstance.id][locale.code][field.name]}
                                compact={true}
                            />
                        </div>
                    {/each}
                    
                    <!-- Repeatable fields with translatable content -->
                    {#each repeatableFieldsWithTranslatableContent as repeatableField}
                        {@const repeatableItems = formData[componentInstance.id]?.[repeatableField.name] || []}
                        {@const translatableNestedFields = getAllFields(repeatableField.schema || []).filter(f => f.translatable)}
                        
                        {#if repeatableItems.length > 0}
                            <div class="space-y-3">
                                <h5 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {repeatableField.label || repeatableField.name}
                                </h5>
                                
                                {#each repeatableItems as item, itemIndex}
                                    <div class="border border-muted rounded-md p-3 space-y-2">
                                        <div class="text-xs text-muted-foreground mb-2">
                                            Item {itemIndex + 1}
                                        </div>
                                        
                                        {#each translatableNestedFields as nestedField}
                                            {@const isDefaultLocale = locale.code === CMS_LOCALE}
                                            {@const isActiveTabForRepeatable = locale.code === activeLocale}
                                            {@const fieldForRepeatableRendering = isActiveTabForRepeatable ? nestedField : {...nestedField, required: false}}
                                            <div class="space-y-1">
                                                {#if isDefaultLocale}
                                                    <!-- For default locale, bind directly to content mode data -->
                                                    <FormField 
                                                        field={fieldForRepeatableRendering}
                                                        fieldId={`${componentInstance.id}-${locale.code}-${repeatableField.name}-${itemIndex}-${nestedField.name}`}
                                                        bind:value={formData[componentInstance.id][repeatableField.name][itemIndex][nestedField.name]}
                                                        compact={true}
                                                    />
                                                {:else}
                                                    <!-- For other locales, use translation data -->
                                                    {@const translationKey = `${repeatableField.name}_${itemIndex}`}
                                                    {#if translationData[componentInstance.id]?.[locale.code]?.[translationKey]?.[nestedField.name] !== undefined}
                                                        <FormField 
                                                            field={fieldForRepeatableRendering}
                                                            fieldId={`${componentInstance.id}-${locale.code}-${repeatableField.name}-${itemIndex}-${nestedField.name}`}
                                                            bind:value={translationData[componentInstance.id][locale.code][translationKey][nestedField.name]}
                                                            compact={true}
                                                        />
                                                    {:else}
                                                        <!-- Loading placeholder -->
                                                        <div class="px-3 py-2 bg-muted/30 rounded-md border text-xs text-muted-foreground">
                                                            Loading...
                                                        </div>
                                                    {/if}
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    {/each}
                </TabsContent>
            {/each}
        </Tabs>
    </div>
{/if} 