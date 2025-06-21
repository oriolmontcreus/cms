<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher } from "mode-watcher";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { autoLogin } from '@/services/auth.service';
	
	let { children } = $props();
	
	const isLoginPage = $derived($page.route.id === '/login');
	let authInitialized = $state(false);
	
	onMount(async () => {
		await autoLogin();
		authInitialized = true;
	});
	
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

{#if !authInitialized}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
			<p class="text-muted-foreground">Loading...</p>
		</div>
	</div>
{:else if isLoginPage}
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
