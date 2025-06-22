<script lang="ts">
    import type { FormField } from '../types';
    import * as Select from "$lib/components/ui/select/index.js";
    import * as Popover from '$lib/components/ui/popover';
    import Button from '$lib/components/ui/button/button.svelte';
    import Input from '$lib/components/ui/input/input.svelte';
    import { cn } from '$lib/utils';
    import Check from '@lucide/svelte/icons/check';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';

    let { field, fieldId, value = $bindable() }: {
        field: FormField;
        fieldId: string;
        value: string | string[];
    } = $props();

    // Transform options to the format expected by shadcn-svelte
    const options = $derived((field.options || []).map(option => ({
        value: option,
        label: option
    })));

    // Separate values for single and multiple modes with proper typing
    let singleValue = $state(
        field.multiple ? "" : (Array.isArray(value) ? "" : (value || ""))
    );

    let multipleValue = $state(
        field.multiple ? (Array.isArray(value) ? value : []) : []
    );

    // Initialize values from props
    $effect(() => {
        if (field.multiple) {
            multipleValue = Array.isArray(value) ? value : [];
        } else {
            singleValue = Array.isArray(value) ? "" : (value || "");
        }
    });

    // Derive trigger content
    const triggerContent = $derived(() => {
        if (field.multiple) {
            const selectedCount = multipleValue.length;
            return selectedCount > 0 
                ? `${selectedCount} selected`
                : field.placeholder || `Select ${field.label}`;
        } else {
            return options.find(opt => opt.value === singleValue)?.label 
                || field.placeholder 
                || `Select ${field.label}`;
        }
    });

    // For searchable functionality
    let searchableOpen = $state(false);
    let searchQuery = $state("");

    // Filter options based on search query
    const filteredOptions = $derived(() => {
        if (!searchQuery) return options;
        return options.filter(option => 
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    function handleSearchableSelect(currentValue: string) {
        if (field.multiple) {
            // Toggle selection for multiple
            const currentValues = multipleValue;
            const index = currentValues.indexOf(currentValue);
            if (index > -1) {
                multipleValue = currentValues.filter(v => v !== currentValue);
                value = multipleValue;
            } else {
                multipleValue = [...currentValues, currentValue];
                value = multipleValue;
            }
        } else {
            // Set single value
            const newValue = currentValue === singleValue ? '' : currentValue;
            singleValue = newValue;
            value = newValue;
            searchableOpen = false;
        }
        
        // Clear search when closing
        if (!field.multiple || !searchableOpen) {
            searchQuery = "";
        }
    }
</script>

{#if field.searchable}
    <!-- Searchable Select using Popover -->
    <Popover.Root bind:open={searchableOpen}>
        <Popover.Trigger>
            {#snippet child({ props })}
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchableOpen}
                    class="bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-ring/20 w-full justify-between px-3 font-normal outline-offset-0 focus-visible:outline-[3px]"
                    disabled={field.disabled}
                    {...props}
                >
                    <span class={cn('truncate', !triggerContent() && 'text-muted-foreground')}>
                        {triggerContent()}
                    </span>
                    <ChevronDown size={16} class="text-muted-foreground/80 shrink-0" aria-hidden="true" />
                </Button>
            {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-full min-w-(--bits-popover-anchor-width) p-0" align="start">
            <div class="p-2">
                <Input
                    placeholder={`Search ${field.label.toLowerCase()}...`}
                    bind:value={searchQuery}
                    class="mb-2"
                />
                <div class="max-h-60 overflow-auto">
                    {#if filteredOptions().length === 0}
                        <div class="py-6 text-center text-sm text-muted-foreground">
                            No {field.label.toLowerCase()} found.
                        </div>
                    {:else}
                        {#each filteredOptions() as option (option.value)}
                            <button
                                type="button"
                                class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                onclick={() => handleSearchableSelect(option.value)}
                            >
                                <span>{option.label}</span>
                                {#if field.multiple}
                                    <Check
                                        size={16}
                                        class={cn(multipleValue.includes(option.value) ? 'opacity-100' : 'opacity-0')}
                                    />
                                {:else}
                                    <Check
                                        size={16}
                                        class={cn(singleValue === option.value ? 'opacity-100' : 'opacity-0')}
                                    />
                                {/if}
                            </button>
                        {/each}
                    {/if}
                </div>
            </div>
        </Popover.Content>
    </Popover.Root>
{:else if field.multiple}
    <!-- Regular Multiple Select -->
    <Select.Root 
        type="multiple" 
        name={fieldId} 
        bind:value={multipleValue}
        onValueChange={(newValue) => {
            multipleValue = newValue || [];
            value = multipleValue;
        }}
    >
        <Select.Trigger class="w-full" disabled={field.disabled}>
            {triggerContent()}
        </Select.Trigger>
        <Select.Content>
            <Select.Group>
                <Select.Label>{field.label}</Select.Label>
                {#each options as option (option.value)}
                    <Select.Item
                        value={option.value}
                        label={option.label}
                    >
                        {option.label}
                    </Select.Item>
                {/each}
            </Select.Group>
        </Select.Content>
    </Select.Root>
{:else}
    <!-- Regular Single Select -->
    <Select.Root 
        type="single" 
        name={fieldId} 
        bind:value={singleValue}
        onValueChange={(newValue) => {
            singleValue = newValue || "";
            value = singleValue;
        }}
    >
        <Select.Trigger class="w-full" disabled={field.disabled}>
            {triggerContent()}
        </Select.Trigger>
        <Select.Content>
            <Select.Group>
                <Select.Label>{field.label}</Select.Label>
                {#each options as option (option.value)}
                    <Select.Item
                        value={option.value}
                        label={option.label}
                    >
                        {option.label}
                    </Select.Item>
                {/each}
            </Select.Group>
        </Select.Content>
    </Select.Root>
{/if} 