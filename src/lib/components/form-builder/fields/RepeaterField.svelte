<script lang="ts">
    import { Button } from "@/lib/components/ui/button";
    import { Card, CardContent } from "@/lib/components/ui/card";
    import PlusIcon from "@tabler/icons-svelte/icons/plus";
    import TrashIcon from "@tabler/icons-svelte/icons/trash";
    import type { FormField, TranslationData } from "../types";
    import { RenderMode } from "../types";
    import UnifiedRenderer from "../components/UnifiedRenderer.svelte";
    import ConfirmPopover from "$lib/components/ConfirmPopover.svelte";
    import { cn } from "$lib/utils";
    import { getContext } from "svelte";
    import type { FormBuilderContext } from "../utils/formHelpers";

    export let field: FormField;
    export let fieldId: string;
    export let value: any[] = [];
    export let isTranslationMode: boolean = false;
    export let currentLocale: string = "";
    export let isDefaultLocale: boolean = true;
    export let translationData: TranslationData = {};
    export const componentId: string = "";

    const formBuilderContext = getContext<FormBuilderContext>("formBuilder");

    let removingItems = new Set<number>();
    $: if (!Array.isArray(value)) {
        value = [];
    }

    // In translation mode, we need special handling for non-default locales
    // Repeater items in translation mode use indexed keys like "fieldName_0", "fieldName_1", etc.
    $: translationMode = isTranslationMode
        ? RenderMode.TRANSLATION
        : RenderMode.CONTENT;

    // Responsive grid configuration
    $: gridConfig = field.responsiveGrid;
    $: hasGrid = !!gridConfig;
    $: columns = gridConfig?.columns || 2;
    $: gap = gridConfig?.gap || 4;
    $: responsive = gridConfig?.responsive;

    $: gridClasses = hasGrid
        ? cn(
              "grid",
              "grid-cols-1",
              responsive?.sm && `sm:grid-cols-${responsive.sm}`,
              responsive?.md && `md:grid-cols-${responsive.md}`,
              responsive?.lg && `lg:grid-cols-${responsive.lg}`,
              !responsive && `md:grid-cols-${columns}`,
              `gap-${gap}`,
          )
        : "space-y-4";

    function addItem() {
        value = [...value, {}];
    }

    function removeItem(index: number) {
        removingItems.add(index);
        removingItems = removingItems;

        setTimeout(() => {
            const itemToRemove = value[index];
            if (itemToRemove && formBuilderContext?.collectFilesForDeletion) {
                formBuilderContext.collectFilesForDeletion(itemToRemove);
            }
            value = value.filter((_, i) => i !== index);
            removingItems.delete(index);
            removingItems = removingItems;
        }, 300);
    }
</script>

<div class="space-y-4">
    {#if !isTranslationMode}
        <div class="flex items-center justify-between">
            <Button type="button" variant="outline" onclick={addItem}>
                <PlusIcon class="w-4 h-4 mr-2" />
                Add Item
            </Button>
        </div>
    {/if}

    <div class={gridClasses}>
        {#each value as item, index (index)}
            {#if field.contained}
                <div
                    class="transition-all duration-300 ease-in-out {removingItems.has(
                        index,
                    )
                        ? ' scale-95 opacity-0'
                        : ''}"
                >
                    <Card>
                        <CardContent>
                            <div class="flex items-start justify-end mb-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => removeItem(index)}
                                    class="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={removingItems.has(index)}
                                >
                                    <TrashIcon class="w-4 h-4" />
                                </Button>
                            </div>
                            <UnifiedRenderer
                                schema={typeof field.schema === "function"
                                    ? field.schema(index)
                                    : field.schema || []}
                                componentId={`${fieldId}-${index}`}
                                bind:formData={value[index]}
                                mode={translationMode}
                                {currentLocale}
                                {isDefaultLocale}
                                {translationData}
                            />
                        </CardContent>
                    </Card>
                </div>
            {:else}
                <div
                    class="space-y-4 transition-all duration-300 ease-in-out {removingItems.has(
                        index,
                    )
                        ? 'bg-red-500/20 scale-95 opacity-0 rounded-lg p-4'
                        : ''}"
                >
                    <div class="flex items-center justify-between">
                        <div class="text-sm font-medium text-muted-foreground">
                            Item {index + 1}
                        </div>
                        <ConfirmPopover
                            title="Delete Item"
                            description="Are you sure you want to delete this item? This action cannot be undone."
                            confirmText="Delete"
                            cancelText="Cancel"
                            variant="destructive"
                            onConfirm={() => removeItem(index)}
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                class="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={removingItems.has(index)}
                            >
                                <TrashIcon class="w-4 h-4" />
                            </Button>
                        </ConfirmPopover>
                    </div>
                    <UnifiedRenderer
                        schema={typeof field.schema === "function"
                            ? field.schema(index)
                            : field.schema || []}
                        componentId={`${fieldId}-${index}`}
                        bind:formData={value[index]}
                        mode={translationMode}
                        {currentLocale}
                        {isDefaultLocale}
                        {translationData}
                    />
                </div>
            {/if}
        {/each}
    </div>
</div>
