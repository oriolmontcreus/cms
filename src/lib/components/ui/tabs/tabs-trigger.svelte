<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"data-[state=active]:bg-primary dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-neutral-700 dark:data-[state=active]:bg-primary text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-sm font-medium focus-visible:outline-1 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50  data-[state=active]:border-neutral-300 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer transition-all duration-300 ease-in-out dark:hover:bg-background/70 hover:bg-primary/20",
		className
	)}
	{...restProps}
/>
