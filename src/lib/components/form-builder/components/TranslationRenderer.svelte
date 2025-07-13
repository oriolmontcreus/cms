<script lang="ts">
    import type { FormData, TranslationData } from '../types';
    import { getTranslatableFields } from '../utils/formHelpers';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
    import FormField from '../FormField.svelte';
    import { CSS_CLASSES } from '../constants';
    
    export let componentInstance: any;
    export let translationData: TranslationData;
    export let locales: readonly { code: string; name: string; }[];
    
    $: translatableFields = getTranslatableFields(componentInstance.component.schema);
    $: hasTranslatableFields = translatableFields.length > 0;
</script>

{#if hasTranslatableFields}
    <div class="border rounded-lg p-4 bg-muted/30">
        <div class="flex items-center gap-2 mb-4">
            <h4 class="text-sm font-medium text-muted-foreground">
                {componentInstance.displayName || componentInstance.component.name}
            </h4>
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {translatableFields.length} translatable field{translatableFields.length === 1 ? '' : 's'}
            </span>
        </div>
        
        <Tabs value={locales[0].code} class="w-full">
            <TabsList class="grid w-full grid-cols-{locales.length} mb-4">
                {#each locales as locale}
                    <TabsTrigger value={locale.code} class="text-xs">
                        {locale.name}
                    </TabsTrigger>
                {/each}
            </TabsList>
            
            {#each locales as locale}
                <TabsContent value={locale.code} class="space-y-3">
                    {#each translatableFields as field}
                        <div class="space-y-1">
                            <FormField 
                                {field}
                                fieldId={`${componentInstance.id}-${locale.code}-${field.name}`}
                                bind:value={translationData[componentInstance.id][locale.code][field.name]}
                                compact={true}
                            />
                        </div>
                    {/each}
                </TabsContent>
            {/each}
        </Tabs>
    </div>
{/if} 