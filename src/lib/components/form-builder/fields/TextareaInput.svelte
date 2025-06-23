<script lang="ts">
    import type { FormField } from '../types';
    import { Textarea } from '@components/ui/textarea';

    export let field: FormField;
    export let fieldId: string;
    export let value: string = '';

    $: currentLength = value?.length || 0;
    $: maxLength = field.max;
    $: showCharCount = maxLength && maxLength > 0;
</script>

<div class="space-y-2">
    <Textarea
        id={fieldId}
        name={fieldId}
        placeholder={field.placeholder}
        required={field.required}
        disabled={field.disabled}
        readonly={field.readonly}
        minlength={field.min}
        maxlength={field.max}
        rows={field.rows}
        style={field.resizable === false ? 'resize: none;' : 'resize: vertical;'}
        aria-describedby={showCharCount ? `${fieldId}-characters-left` : undefined}
        bind:value
    />
    {#if showCharCount}
        <p
            id="{fieldId}-characters-left"
            class="text-muted-foreground mt-2 text-right text-xs"
            role="status"
            aria-live="polite"
        >
            <span class="tabular-nums">{currentLength}/{maxLength}</span>
        </p>
    {/if}
</div> 