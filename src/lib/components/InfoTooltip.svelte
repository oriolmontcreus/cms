<script lang="ts">
    import InfoCircle from "@tabler/icons-svelte/icons/info-circle";
    import {
        Tooltip,
        TooltipContent,
        TooltipProvider,
        TooltipTrigger,
    } from "$lib/components/ui/tooltip";

    // Props
    export let className: string = "";
    export let sideOffset: number = 4;
    export let delayDuration: number = 300;
    export let triggerClass: string =
        "text-blue-500 hover:text-blue-500/60 cursor-help transition-colors";
    export let contentClass: string = "py-3 max-w-xs";
</script>

<TooltipProvider {delayDuration}>
    <Tooltip>
        <TooltipTrigger>
            <InfoCircle class={triggerClass} />
        </TooltipTrigger>
        <TooltipContent class="{contentClass} {className}" {sideOffset}>
            <slot />
        </TooltipContent>
    </Tooltip>
</TooltipProvider>
