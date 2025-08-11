<script lang="ts">
    import type { FormField } from "../types";
    import TagsInputComponent from "@components/ui/tags-input/tags-input.svelte";
    import { cn } from "$lib/utils";

    export let field: FormField;
    export let fieldId: string;
    export let value: string[] = [];

    // Ensure value is always an array
    $: if (!Array.isArray(value)) {
        value = [];
    }

    // Custom validation function that combines field-specific validation with general rules
    const validate = (tag: string, existingTags: string[]) => {
        const trimmed = tag.trim();

        // Disallow empty tags
        if (trimmed.length === 0) return undefined;

        // Check max length if specified
        if (field.max && trimmed.length > field.max) return undefined;

        // Check min length if specified
        if (field.min && trimmed.length < field.min) return undefined;

        // Check pattern if specified
        if (field.pattern) {
            const regex = new RegExp(field.pattern);
            if (!regex.test(trimmed)) return undefined;
        }

        // Check duplicates (unless explicitly allowed)
        if (!field.allowDuplicates && existingTags.includes(trimmed))
            return undefined;

        // Check max tags limit
        if (field.maxTags && existingTags.length >= field.maxTags)
            return undefined;

        // Apply custom validation if provided
        if (field.validateTag) {
            return field.validateTag(trimmed, existingTags);
        }

        return trimmed;
    };

    // Handle max tags constraint by preventing addition of new tags when limit is reached
    $: isMaxReached = field.maxTags ? value.length >= field.maxTags : false;
    $: placeholderText = isMaxReached
        ? `Maximum ${field.maxTags} tags reached`
        : field.placeholder || "Add tags...";
</script>

<TagsInputComponent
    bind:value
    placeholder={placeholderText}
    disabled={field.disabled || isMaxReached}
    allowDuplicates={field.allowDuplicates}
    {validate}
    class={cn("w-full", field.disabled && "opacity-50 cursor-not-allowed")}
    id={fieldId}
    name={fieldId}
/>

{#if field.helperText}
    <p class="text-sm text-muted-foreground mt-1">{field.helperText}</p>
{/if}

{#if field.maxTags}
    <p class="text-xs text-muted-foreground mt-1">
        {value.length}/{field.maxTags} tags
    </p>
{/if}
