<script lang="ts">
    import type { FormField } from '../types';
    import * as Select from "$lib/components/ui/select/index.js";

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
    let singleValue = $derived.by(() => {
        if (field.multiple) return "";
        return Array.isArray(value) ? "" : (value || "");
    });

    let multipleValue = $derived.by(() => {
        if (!field.multiple) return [];
        return Array.isArray(value) ? value : [];
    });

    // Update the main value when single or multiple values change
    $effect(() => {
        if (field.multiple) {
            value = multipleValue;
        } else {
            value = singleValue;
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
</script>

{#if field.multiple}
    <Select.Root type="multiple" name={fieldId} bind:value={multipleValue}>
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
    <Select.Root type="single" name={fieldId} bind:value={singleValue}>
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