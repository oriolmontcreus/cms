<script lang="ts">
    import { page } from '$app/stores';
    import FormBuilder from '$lib/components/form-builder/FormBuilder.svelte';
    import type { PageConfig } from '$lib/components/form-builder/types';
    import { handleGetPageBySlug } from '@/services/page.service';
    import type { Page } from '@shared/types/pages';
    import { onMount } from 'svelte';
    import SiteHeader from '$lib/components/site-header.svelte';

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
</script>

<SiteHeader title={config?.title || 'Page'} />
<div class="flex flex-1 flex-col">
    <div class="@container/main flex flex-1 flex-col gap-2">
        <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div class="px-4 lg:px-6">
                {#if loading}
                    <div class="flex items-center justify-center min-h-[200px]">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                {:else if error}
                    <div class="max-w-2xl mx-auto py-8">
                        <div class="text-red-500 text-center">{error}</div>
                    </div>
                {:else if config && pageData}
                    <div class="max-w-2xl mx-auto">
                        <FormBuilder 
                            {config} 
                            slug={pageData.slug} 
                            components={pageData.components}
                        />
                    </div>
                {:else}
                    <div class="max-w-2xl mx-auto py-8">
                        <div class="text-center text-gray-500">Page not found</div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div> 