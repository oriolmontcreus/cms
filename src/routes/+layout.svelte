<script lang="ts">
	import "../app.css";
	import { Toaster } from "svelte-sonner";
	import { ModeWatcher, mode } from "mode-watcher";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { onNavigate } from "$app/navigation";
	import { page } from "$app/state";
	import { onMount } from "svelte";
	import { autoLogin } from "@/services/auth.service";
	import PageLoading from "$lib/components/PageLoading.svelte";
	import { fade } from "svelte/transition";

	let { children } = $props();

	const isLoginPage = $derived(page.url.pathname === "/login");
	const isSetupPage = $derived(page.url.pathname === "/setup");
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

{#if authInitialized}
	<main in:fade={{ duration: 400 }}>
		{#if isLoginPage || isSetupPage}
			<div style="view-transition-name: main-content;" class="h-full">
				{@render children()}
			</div>
		{:else}
			<Sidebar.Provider
				style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
			>
				<AppSidebar variant="inset" />
				<Sidebar.Inset>
					<div
						style="view-transition-name: main-content;"
						class="h-full"
					>
						{@render children()}
					</div>
				</Sidebar.Inset>
			</Sidebar.Provider>
		{/if}
	</main>
{:else}
	<PageLoading />
{/if}

<Toaster richColors theme={mode.current === "dark" ? "dark" : "light"} />
<ModeWatcher defaultMode="dark" />
