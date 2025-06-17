<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher } from "mode-watcher";
	
	let { children } = $props();
</script>

<svelte:head>
    <title>Froggy</title>
</svelte:head>

<Toaster richColors />
<ModeWatcher defaultMode="dark" />
{@render children()}
