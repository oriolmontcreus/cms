<script lang="ts">
    import type { FormField } from '../types';
    import { Input } from '@components/ui/input';
    import { cn } from '$lib/utils';

    export let field: FormField;
    export let fieldId: string;
    export let value: string;

    $: hasPrefix = field.prefix !== undefined;
    $: hasSuffix = field.suffix !== undefined;
    $: inputClasses = cn(
        hasPrefix && 'ps-9',
        hasSuffix && 'pe-9'
    );

    function isString(value: any): value is string {
        return typeof value === 'string';
    }
</script>

{#if hasPrefix || hasSuffix}
    <div class="relative">
        <Input
            type="text"
            id={fieldId}
            name={fieldId}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            readonly={field.readonly}
            minlength={field.min}
            maxlength={field.max}
            pattern={field.pattern}
            class={inputClasses}
            bind:value
        />
        
        {#if hasPrefix}
            <div class="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                {#if isString(field.prefix)}
                    <span class="text-sm font-medium">{field.prefix}</span>
                {:else}
                    <svelte:component this={field.prefix} size={16} aria-hidden="true" />
                {/if}
            </div>
        {/if}
        
        {#if hasSuffix}
            <div class="text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 peer-disabled:opacity-50">
                {#if isString(field.suffix)}
                    <span class="text-sm font-medium">{field.suffix}</span>
                {:else}
                    <svelte:component this={field.suffix} size={16} aria-hidden="true" />
                {/if}
            </div>
        {/if}
    </div>
{:else}
    <Input
        type="text"
        id={fieldId}
        name={fieldId}
        placeholder={field.placeholder}
        required={field.required}
        disabled={field.disabled}
        readonly={field.readonly}
        minlength={field.min}
        maxlength={field.max}
        pattern={field.pattern}
        bind:value
    />
{/if} 