<script lang="ts">
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import * as Sheet from "$lib/components/ui/sheet/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import SiteHeader from "$lib/components/site-header.svelte";
    import PlusIcon from "@tabler/icons-svelte/icons/plus";
    import { handleCreatePage, handleGetPages } from "@/services/page.service";
    import { onMount } from "svelte";
    import type { Page } from "@shared/types/pages";

    let open = false;
    let title = "";
    let slug = "";
    let pages: Page[] = [];

    async function handleSubmit() {
        const page = await handleCreatePage(title, slug);
        if (page) {
            open = false;
            title = "";
            slug = "";
            // Refresh the pages list
            pages = await handleGetPages();
        }
    }

    onMount(async () => {
        pages = await handleGetPages();
    });

    $: if (title) {
        slug = title.toLowerCase().replace(/\s+/g, '-');
    }
</script>

<Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
    <AppSidebar variant="inset" />
    <Sidebar.Inset>
        <SiteHeader title="Pages" />
        <div class="flex flex-1 flex-col">
            <div class="@container/main flex flex-1 flex-col gap-2">
                <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div class="flex justify-between items-center px-4">
                        <div class="text-sm text-muted-foreground">
                            {pages.length} page{pages.length === 1 ? '' : 's'} total
                        </div>
                        <Sheet.Root bind:open>
                            <Sheet.Trigger>
                                <Button>
                                    <PlusIcon />
                                    New Page
                                </Button>
                            </Sheet.Trigger>
                            <Sheet.Content>
                                <Sheet.Header>
                                    <Sheet.Title>Create New Page</Sheet.Title>
                                    <Sheet.Description>
                                        Add a new page to your CMS. The URL slug will be automatically generated from the title.
                                    </Sheet.Description>
                                </Sheet.Header>
                                <div class="grid gap-4 py-4 px-4">
                                    <div class="grid gap-2">
                                        <Label for="title">Title</Label>
                                        <Input id="title" bind:value={title} placeholder="Enter page title" />
                                    </div>
                                    <div class="grid gap-2">
                                        <Label for="slug">URL Slug</Label>
                                        <Input id="slug" bind:value={slug} placeholder="url-slug" />
                                    </div>
                                </div>
                                <Sheet.Footer>
                                    <Button onclick={handleSubmit}>Create Page</Button>
                                </Sheet.Footer>
                            </Sheet.Content>
                        </Sheet.Root>
                    </div>

                    <!-- Pages List -->
                    <div class="px-4">
                        {#if pages.length === 0}
                            <div class="text-center text-muted-foreground py-8">
                                No pages created yet. Click the "New Page" button to create one.
                            </div>
                        {:else}
                            <div class="grid gap-4">
                                {#each pages as page}
                                    <a 
                                        href="/pages/{page.slug}" 
                                        class="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted transition-colors"
                                    >
                                        <div>
                                            <h3 class="font-medium">{page.title}</h3>
                                            <p class="text-sm text-muted-foreground">/{page.slug}</p>
                                        </div>
                                        <div class="text-sm text-muted-foreground">
                                            Created {new Date(page.createdAt).toLocaleDateString()}
                                        </div>
                                    </a>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </Sidebar.Inset>
</Sidebar.Provider>