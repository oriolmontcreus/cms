<script lang="ts">
    import { TabsTrigger } from '$lib/components/ui/tabs';
    
    export let tab: { name: string; label: string; icon?: any };
    export let value: string;
</script>

<TabsTrigger 
    {value} 
    class="flex items-center justify-center gap-2 group relative min-w-0 overflow-hidden"
    title={tab.label}
>
    <div class="flex items-center justify-center min-w-0 w-full">
        <div class="flex items-center gap-2 min-w-0">
            {#if tab.icon}
                <svelte:component this={tab.icon} size={16} aria-hidden="true" class="shrink-0" />
            {:else}
                <span class="flex items-center justify-center w-4 h-4 text-xs font-medium rounded bg-muted text-muted-foreground shrink-0">
                    {tab.label.charAt(0).toUpperCase()}
                </span>
            {/if}
            <span class="hidden sm:inline truncate min-w-0" title={tab.label}>{tab.label}</span>
        </div>
    </div>
    
    <!-- Custom tooltip for mobile -->
    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap sm:hidden">
        {tab.label}
    </div>
</TabsTrigger> 