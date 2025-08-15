<script lang="ts">
    import type { TooltipState } from "../composables/useVariableTooltip";
    import type { Writable } from "svelte/store";

    export let tooltipState: Writable<TooltipState>;

    $: ({ show, content, position } = $tooltipState);
</script>

{#if show}
    <div
        class="fixed z-50 bg-popover text-popover-foreground border border-border rounded-md px-3 py-1.5 text-sm shadow-md pointer-events-none"
        style="left: {position.x}px; top: {position.y}px; transform: translateX(-50%) translateY(-100%);"
    >
        {content}
    </div>
{/if}
