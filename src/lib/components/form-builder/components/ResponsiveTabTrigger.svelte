<script lang="ts">
    import { TabsTrigger } from "$lib/components/ui/tabs";

    export let tab: { name: string; label: string; icon?: any };
    export let value: string;
</script>

<TabsTrigger
    {value}
    class="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none group flex items-center gap-2 px-3 py-2 whitespace-nowrap"
    title={tab.label}
>
    {#if tab.icon}
        <svelte:component
            this={tab.icon}
            size={16}
            aria-hidden="true"
            class="shrink-0 opacity-60"
        />
    {:else}
        <span
            class="flex items-center justify-center w-4 h-4 text-xs font-medium rounded bg-muted text-muted-foreground shrink-0 opacity-60"
        >
            {tab.label.charAt(0).toUpperCase()}
        </span>
    {/if}
    <span class="hidden sm:inline" title={tab.label}>{tab.label}</span>

    <!-- Custom tooltip for mobile -->
    <div
        class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap sm:hidden"
    >
        {tab.label}
    </div>
</TabsTrigger>
