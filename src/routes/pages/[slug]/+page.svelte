<script lang="ts">
    import { page } from '$app/stores';
    import FormBuilder from '$lib/components/form-builder/FormBuilder.svelte';
    import type { FormData, PageConfig } from '$lib/components/form-builder/types';
    import { onMount } from 'svelte';

    let config: PageConfig | null = null;
    let error: string | null = null;

    onMount(async () => {
        try {
            const slug = $page.params.slug;
            // Use Vite's glob import with TypeScript files
            const modules = import.meta.glob('$lib/components/form-builder/pages/*.ts', { eager: true });
            const modulePath = `/src/lib/components/form-builder/pages/${slug}.ts`;
            
            if (modules[modulePath]) {
                config = (modules[modulePath] as any).config;
            } else {
                error = 'Page not found';
            }
        } catch (e) {
            error = 'Failed to load page configuration';
            console.error(e);
        }
    });

    async function handleSubmit(data: FormData) {
        try {
            // Here you would typically save the form data
            console.log('Form data:', data);
            // You can implement your save logic here
        } catch (e) {
            console.error('Failed to save form data:', e);
        }
    }
</script>

{#if error}
    <div class="text-red-500">{error}</div>
{:else if config}
    <div class="max-w-2xl mx-auto py-8">
        <h1 class="text-2xl font-bold mb-6">{config.title}</h1>
        <FormBuilder {config} onSubmit={handleSubmit} />
    </div>
{:else}
    <div class="flex items-center justify-center min-h-[200px]">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
{/if} 