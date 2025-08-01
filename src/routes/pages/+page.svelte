<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import { Card, CardContent } from "$lib/components/ui/card";
    import SiteHeader from "$lib/components/site-header.svelte";
    import PageCard from "$lib/components/PageCard.svelte";
    import { handleGetPages } from "@/services/page.service";
    import { handleTriggerBuild } from "@/services/build.service";
    import type { Page } from "@/lib/shared/types/pages.type";
    import { ScrollArea } from "$lib/components/ui/scroll-area";
    import Spinner from "@components/Spinner.svelte";

    let pages: Page[] = [];
    let loading = true;
    let error: string | null = null;
    let isBuilding = false;

    onMount(async () => {
        pages = await handleGetPages();
        loading = false;
    });

    function handlePageClick(slug: string) {
        goto(`/pages/${slug}`);
    }

    async function handlePublish() {
        isBuilding = true;
        await handleTriggerBuild();
        isBuilding = false;
    }
</script>

<SiteHeader title="Pages" />
<div class="flex flex-1 flex-col">
    <ScrollArea
        class="@container/main flex flex-col gap-2 max-h-[calc(100dvh-80px)]"
    >
        <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div class="px-4 lg:px-6">
                <div class="flex justify-between items-center mb-8">
                    <div class="flex gap-2">
                        <Button
                            onclick={handlePublish}
                            disabled={isBuilding}
                            variant="default"
                            class="bg-green-600 hover:bg-green-700"
                        >
                            {#if isBuilding}
                                <div
                                    class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                                ></div>
                                Publishing...
                            {:else}
                                🚀 Publish Site
                            {/if}
                        </Button>
                        <Button onclick={() => goto("/pages/new")}
                            >Create New Page</Button
                        >
                    </div>
                </div>

                {#if loading}
                    <div class="text-center py-8 flex justify-center">
                        <Spinner />
                    </div>
                {:else if error}
                    <div class="text-red-500">{error}</div>
                {:else if pages.length === 0}
                    <Card>
                        <CardContent class="py-8">
                            <div class="text-center text-gray-500">
                                No pages found. Create your first page to get
                                started.
                            </div>
                        </CardContent>
                    </Card>
                {:else}
                    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {#each pages as page}
                            <PageCard
                                {page}
                                onclick={() => handlePageClick(page.slug)}
                            />
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </ScrollArea>
</div>
