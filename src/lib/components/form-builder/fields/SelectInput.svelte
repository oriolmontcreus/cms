<script lang="ts">
    import type { FormField } from "../types";
    import * as Select from "$lib/components/ui/select/index.js";
    import * as Popover from "$lib/components/ui/popover";
    import Button from "$lib/components/ui/button/button.svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import { cn } from "$lib/utils";
    import Check from "@lucide/svelte/icons/check";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";

    let {
        field,
        fieldId,
        value = $bindable(),
    }: {
        field: FormField;
        fieldId: string;
        value: string | string[];
    } = $props();

    const options = $derived(
        (field.options || []).map((option) => ({
            value: option,
            label: option,
        })),
    );

    let singleValue = $state(
        field.multiple ? "" : Array.isArray(value) ? "" : value || "",
    );
    let multipleValue = $state(
        field.multiple ? (Array.isArray(value) ? value : []) : [],
    );

    $effect(() => {
        if (field.multiple) {
            multipleValue = Array.isArray(value) ? value : [];
        } else {
            singleValue = Array.isArray(value) ? "" : value || "";
        }
    });

    const triggerContent = $derived(() => {
        if (field.multiple) {
            const count = multipleValue.length;
            return count > 0
                ? `${count} selected`
                : field.placeholder || `Select ${field.label}`;
        }
        return (
            options.find((opt) => opt.value === singleValue)?.label ||
            field.placeholder ||
            `Select ${field.label}`
        );
    });

    let searchableOpen = $state(false);
    let searchQuery = $state("");

    const filteredOptions = $derived(() =>
        searchQuery
            ? options.filter((option) =>
                  option.label
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
              )
            : options,
    );

    function handleSearchableSelect(currentValue: string) {
        if (field.multiple) {
            const index = multipleValue.indexOf(currentValue);
            multipleValue =
                index > -1
                    ? multipleValue.filter((v) => v !== currentValue)
                    : [...multipleValue, currentValue];
            value = multipleValue;
        } else {
            singleValue = currentValue === singleValue ? "" : currentValue;
            value = singleValue;
            searchableOpen = false;
        }

        if (!field.multiple || !searchableOpen) searchQuery = "";
    }

    function handleSelectChange(newValue: string | string[]) {
        if (field.multiple) {
            multipleValue = (newValue as string[]) || [];
            value = multipleValue;
        } else {
            singleValue = (newValue as string) || "";
            value = singleValue;
        }
    }
</script>

{#if field.searchable}
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
                    <span
                        class={cn(
                            "truncate",
                            !triggerContent() && "text-muted-foreground",
                        )}
                    >
                        {triggerContent()}
                    </span>
                    <ChevronDown
                        size={16}
                        class="text-muted-foreground/80 shrink-0"
                        aria-hidden="true"
                    />
                </Button>
            {/snippet}
        </Popover.Trigger>
        <Popover.Content
            class="w-full min-w-(--bits-popover-anchor-width) p-0"
            align="start"
        >
            <div class="p-2">
                <Input
                    id={`${fieldId}-search`}
                    name={`${fieldId}-search`}
                    placeholder={`Search ${field.label.toLowerCase()}...`}
                    bind:value={searchQuery}
                    class="mb-2"
                />
                <div class="max-h-60 overflow-auto">
                    {#if filteredOptions().length === 0}
                        <div
                            class="py-6 text-center text-sm text-muted-foreground"
                        >
                            No {field.label.toLowerCase()} found.
                        </div>
                    {:else}
                        {#each filteredOptions() as option (option.value)}
                            <button
                                type="button"
                                class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-all duration-300 ease-in-out cursor-pointer"
                                onclick={() =>
                                    handleSearchableSelect(option.value)}
                            >
                                <span>{option.label}</span>
                                <Check
                                    size={16}
                                    class={cn(
                                        field.multiple
                                            ? multipleValue.includes(
                                                  option.value,
                                              )
                                                ? "opacity-100"
                                                : "opacity-0"
                                            : singleValue === option.value
                                              ? "opacity-100"
                                              : "opacity-0",
                                    )}
                                />
                            </button>
                        {/each}
                    {/if}
                </div>
            </div>
        </Popover.Content>
    </Popover.Root>
{:else if field.multiple}
    <Select.Root
        type="multiple"
        name={fieldId}
        value={multipleValue}
        onValueChange={handleSelectChange}
    >
        <Select.Trigger class="w-full" disabled={field.disabled}>
            {triggerContent()}
        </Select.Trigger>
        <Select.Content>
            <Select.Group>
                <Select.Label>{field.label}</Select.Label>
                {#each options as option (option.value)}
                    <Select.Item value={option.value} label={option.label}>
                        {option.label}
                    </Select.Item>
                {/each}
            </Select.Group>
        </Select.Content>
    </Select.Root>
{:else}
    <Select.Root
        type="single"
        name={fieldId}
        value={singleValue}
        onValueChange={handleSelectChange}
    >
        <Select.Trigger class="w-full" disabled={field.disabled}>
            {triggerContent()}
        </Select.Trigger>
        <Select.Content>
            <Select.Group>
                <Select.Label>{field.label}</Select.Label>
                {#each options as option (option.value)}
                    <Select.Item value={option.value} label={option.label}>
                        {option.label}
                    </Select.Item>
                {/each}
            </Select.Group>
        </Select.Content>
    </Select.Root>
{/if}
