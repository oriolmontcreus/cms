<script lang="ts">
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import ThemeToggle from "./ThemeToggle.svelte";
	import type { Snippet } from "svelte";
	import { globalValidationState } from "$lib/stores/validationState";

	let { title, children }: { title: string; children?: Snippet } = $props();

	const sidebar = Sidebar.useSidebar();
	const validationState = $derived($globalValidationState);

	// Show badge when sidebar is collapsed and there are validation errors
	const showValidationBadge = $derived(
		sidebar.state === "collapsed" && validationState.errors.length > 0,
	);
</script>

<header
	class="h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) flex shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<div class="relative">
			<Sidebar.Trigger class="-ml-1" />
			{#if showValidationBadge}
				<Badge
					variant="destructive"
					class="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs font-medium min-w-[16px]"
				>
					{validationState.errors.length}
				</Badge>
			{/if}
		</div>
		<Separator
			orientation="vertical"
			class="mx-2 data-[orientation=vertical]:h-4"
		/>
		<h1 class="text-base font-medium select-none">{title}</h1>
		<div class="ml-auto flex items-center gap-2">
			{@render children?.()}
			<ThemeToggle />
		</div>
	</div>
</header>
