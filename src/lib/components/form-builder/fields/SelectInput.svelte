<script lang="ts">
    import type { FormField } from '../types';

    export let field: FormField;
    export let fieldId: string;
    export let value: string | string[];

    const selectClasses = "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
</script>

{#if field.multiple}
    <select
        id={fieldId}
        name={fieldId}
        class={selectClasses}
        required={field.required}
        disabled={field.disabled}
        multiple
        bind:value={value as string[]}
    >
        {#each field.options || [] as option}
            <option value={option}>{option}</option>
        {/each}
    </select>
{:else}
    <select
        id={fieldId}
        name={fieldId}
        class={selectClasses}
        required={field.required}
        disabled={field.disabled}
        bind:value={value as string}
    >
        <option value="">{field.placeholder || `Select ${field.label}`}</option>
        {#each field.options || [] as option}
            <option value={option}>{option}</option>
        {/each}
    </select>
{/if} 