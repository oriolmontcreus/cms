<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher } from "mode-watcher";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	
	let { children } = $props();
	
	const isLoginPage = $derived($page.route.id === '/login');
	
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
    <title>Froggy</title>
</svelte:head>

<Toaster richColors />
<ModeWatcher defaultMode="dark" />

{#if isLoginPage}
	<div style="view-transition-name: main-content;" class="h-full">
		{@render children()}
	</div>
{:else}
	<Sidebar.Provider
		style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
	>
		<AppSidebar variant="inset" />
		<Sidebar.Inset>
			<div style="view-transition-name: main-content;" class="h-full">
				{@render children()}
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
