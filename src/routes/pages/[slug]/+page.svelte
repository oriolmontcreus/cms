<script lang="ts">
    import { page } from '$app/stores';
    import FormBuilder from '$lib/components/form-builder/FormBuilder.svelte';
    import type { PageConfig } from '$lib/components/form-builder/types';
    import { handleGetPageBySlug } from '@/services/page.service';
    import type { Page } from '@shared/types/pages';
    import { onMount } from 'svelte';

    let pageData: Page | null = null;
    let config: PageConfig | null = null;
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            loading = true;
            const slug = $page.params.slug;
            pageData = await handleGetPageBySlug(slug);
            
            if (pageData && pageData.config) {
                config = pageData.config as PageConfig;
            } else {
                error = 'Page not found or no configuration available';
            }
        } catch (e) {
            error = 'Failed to load page';
            console.error(e);
        } finally {
            loading = false;
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

{#if loading}
    <div class="flex items-center justify-center min-h-[200px]">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
{:else if error}
    <div class="max-w-2xl mx-auto py-8">
        <div class="text-red-500 text-center">{error}</div>
    </div>
{:else if config && pageData}
    <div class="max-w-2xl mx-auto py-8">
        <h1 class="text-2xl font-bold mb-6">{config.title}</h1>
        <FormBuilder 
            {config} 
            slug={pageData.slug} 
            initialData={pageData.formData}
        />
    </div>
{:else}
    <div class="max-w-2xl mx-auto py-8">
        <div class="text-center text-gray-500">Page not found</div>
    </div>
{/if} 