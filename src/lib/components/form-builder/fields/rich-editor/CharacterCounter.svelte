<script lang="ts">
    export let fieldId: string;
    export let currentLength: number;
    export let maxLength: number;
</script>

<p
    id="{fieldId}-characters-left"
    class="text-muted-foreground mt-2 text-right text-xs"
    role="status"
    aria-live="polite"
>
    <span class="tabular-nums">{currentLength}/{maxLength}</span>
</p> 