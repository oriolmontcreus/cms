<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
	import CircleIcon from "@lucide/svelte/icons/circle";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
	import { scale } from "svelte/transition";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> = $props();
</script>

<RadioGroupPrimitive.Item
	bind:ref
	data-slot="radio-group-item"
	class={cn(
		"border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 shadow-xs aspect-square size-4 shrink-0 rounded-full border outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
		className,
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<div
			data-slot="radio-group-indicator"
			class="relative flex items-center justify-center"
		>
			{#if checked}
				<div
					in:scale={{ duration: 200, start: 0.3 }}
					out:scale={{ duration: 150, start: 1 }}
					class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
				>
					<CircleIcon class="fill-primary size-2" />
				</div>
			{/if}
		</div>
	{/snippet}
</RadioGroupPrimitive.Item>
