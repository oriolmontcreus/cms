<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import SiteHeader from "$lib/components/site-header.svelte";
    import { handleGetPages, handleUpdatePage } from "@/services/page.service";
    import { api } from "@/lib/utils/api";
    import type { Page } from "@shared/types/pages";

    let currentPage: Page | null = null;
    let content = "";

    onMount(async () => {
        const pages = await handleGetPages();
        currentPage = pages.find(p => p.slug === $page.params.slug) || null;
        if (currentPage) {
            content = currentPage.content || "";
        }
    });

    async function handlePublish() {
        if (!currentPage) return;
        
        // First update the content in our CMS
        const updatedPage = await handleUpdatePage(currentPage.slug, content);
        if (!updatedPage) return;
        
        try {
            // Call our backend to trigger the Astro build
            const { data } = await api.post('/build', updatedPage);
            console.log('Static site build triggered successfully');
        } catch (error) {
            console.error('Error triggering build:', error);
        }
    }
</script>

<Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
    <AppSidebar variant="inset" />
    <Sidebar.Inset>
        <SiteHeader title={currentPage?.title || 'Loading...'} />
        <div class="flex flex-1 flex-col">
            <div class="@container/main flex flex-1 flex-col gap-2">
                <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
                    {#if currentPage}
                        <div class="grid gap-4">
                            <div class="grid gap-2">
                                <Label for="content">Page Content</Label>
                                <Input 
                                    id="content" 
                                    bind:value={content} 
                                    placeholder="Enter page content" 
                                />
                            </div>
                            <div class="flex items-center gap-2">
                                <Button onclick={handlePublish}>Publish</Button>
                                <p class="text-sm text-muted-foreground">
                                    This will update the content and trigger a static site build
                                </p>
                            </div>
                        </div>
                    {:else}
                        <div class="text-center text-muted-foreground py-8">
                            Page not found
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </Sidebar.Inset>
</Sidebar.Provider> 