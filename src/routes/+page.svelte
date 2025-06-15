<script lang="ts">
    import { Button } from "$lib/components/ui/button";

    let name = 'World';
</script>

<h1 class="text-3xl font-bold underline bg-red-500">Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<p>Hello {name}!</p>

<Button onclick={() => name = 'Svelte'}>Click me</Button>
