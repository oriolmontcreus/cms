<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { Button } from '$lib/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import type { PageConfig } from '$lib/components/form-builder/types';

    let pages: Array<Pick<PageConfig, 'title' | 'slug'>> = [];
    let error: string | null = null;

    onMount(async () => {
        try {
            // Use Vite's glob import with TypeScript files
            const modules = import.meta.glob('$lib/components/form-builder/pages/*.ts', { eager: true });
            
            pages = Object.entries(modules).map(([path, module]: [string, any]) => {
                const config = module.config as PageConfig;
                return {
                    title: config.title,
                    slug: config.slug
                };
            });
        } catch (e) {
            error = 'Failed to load pages';
            console.error(e);
        }
    });

    function handlePageClick(slug: string) {
        goto(`/pages/${slug}`);
    }
</script>

<div class="max-w-4xl mx-auto py-8 px-4">
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Pages</h1>
        <Button onclick={() => goto('/pages/new')}>Create New Page</Button>
    </div>

    {#if error}
        <div class="text-red-500">{error}</div>
    {:else if pages.length === 0}
        <Card>
            <CardContent class="py-8">
                <div class="text-center text-gray-500">
                    No pages found. Create your first page to get started.
                </div>
            </CardContent>
        </Card>
    {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each pages as page}
                <Card class="cursor-pointer hover:bg-gray-50" onclick={() => handlePageClick(page.slug)}>
                    <CardHeader>
                        <CardTitle>{page.title}</CardTitle>
                        <CardDescription>/{page.slug}</CardDescription>
                    </CardHeader>
                </Card>
            {/each}
        </div>
    {/if}
</div>