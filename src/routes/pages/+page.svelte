<script lang="ts">
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import * as Sheet from "$lib/components/ui/sheet/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import SiteHeader from "$lib/components/site-header.svelte";
    import PlusIcon from "@tabler/icons-svelte/icons/plus";

    let open = false;
    let title = "";
    let slug = "";

    function handleSubmit() {
        console.log({ title, slug });
        open = false;
        title = "";
        slug = "";
    }

    $: if (title) slug = title.toLowerCase().replace(/\s+/g, '-');
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
                    <div class="flex justify-end px-4">
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
                </div>
            </div>
        </div>
    </Sidebar.Inset>
</Sidebar.Provider>