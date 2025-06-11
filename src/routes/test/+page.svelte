<script lang="ts">
  import { onMount } from 'svelte';

  let data: any = null;
  let error: string | null = null;
  let loading = true;

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/test');
      if (!response.ok) throw new Error('Failed to fetch data');
      data = await response.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'An error occurred';
    } finally {
      loading = false;
    }
  });
</script>

<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">API Test Page</h1>

  {#if loading}
    <p>Loading...</p>
  {:else if error}
    <p class="text-red-500">Error: {error}</p>
  {:else if data}
    <div class="space-y-4">
      <p class="text-gray-600">Timestamp: {data.timestamp}</p>
      <p class="text-gray-600">Total items: {data.total}</p>
      
      <div class="grid gap-4">
        {#each data.items as item}
          <div class="p-4 border rounded shadow">
            <h2 class="text-xl font-semibold">{item.name}</h2>
            <p class="text-gray-600">{item.description}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div> 