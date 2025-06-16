<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	
	let { children } = $props();
</script>

<svelte:head>
    <title>Froggy</title>
</svelte:head>

<Toaster richColors />
{@render children()}
