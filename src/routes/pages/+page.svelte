<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import SiteHeader from "$lib/components/site-header.svelte";
    import { handleGetPages } from "@/services/page.service";
    import { handleTriggerBuild } from "@/services/build.service";
    import type { Page } from "@/lib/shared/types/pages.type";
    import { ScrollArea } from "$lib/components/ui/scroll-area";
    import Spinner from "@components/Spinner.svelte";
    import { formatDateTime } from "$lib/utils";
    import { IconChevronRight, IconChevronDown } from "@tabler/icons-svelte";
    import { slide } from "svelte/transition";

    interface PageNode {
        page: Page;
        children: PageNode[];
        isExpanded: boolean;
    }

    let pages: Page[] = [];
    let pageTree: PageNode[] = [];
    let loading = true;
    let error: string | null = null;
    let isBuilding = false;

    onMount(async () => {
        pages = await handleGetPages();
        pageTree = buildPageTree(pages);
        loading = false;
    });

    function buildPageTree(pages: Page[]): PageNode[] {
        const nodeMap = new Map<string, PageNode>();
        const rootNodes: PageNode[] = [];

        pages.forEach((page) => {
            nodeMap.set(page.slug, {
                page,
                children: [],
                isExpanded: true, // Start expanded by default
            });
        });

        pages.forEach((page) => {
            const node = nodeMap.get(page.slug)!;

            if (page.parentSlug) {
                const parentNode = nodeMap.get(page.parentSlug);
                if (parentNode) {
                    parentNode.children.push(node);
                } else {
                    rootNodes.push(node);
                }
            } else {
                rootNodes.push(node);
            }
        });

        const sortNodes = (nodes: PageNode[]) => {
            nodes.sort((a, b) => a.page.title.localeCompare(b.page.title));
            nodes.forEach((node) => sortNodes(node.children));
        };

        sortNodes(rootNodes);
        return rootNodes;
    }

    function getFullSlug(page: Page): string {
        return page.slug;
    }

    function handlePageClick(page: Page) {
        const fullSlug = getFullSlug(page);
        goto(`/pages/${fullSlug}`);
    }

    function toggleExpand(node: PageNode) {
        node.isExpanded = !node.isExpanded;
        pageTree = [...pageTree];
    }

    async function handlePublish() {
        isBuilding = true;
        await handleTriggerBuild();
        isBuilding = false;
    }
</script>

<SiteHeader title="Pages">
    <div class="flex items-center gap-2">
        <Button
            onclick={handlePublish}
            disabled={isBuilding}
            variant="default"
            size="sm"
            class="bg-green-600 hover:bg-green-700"
        >
            {#if isBuilding}
                <div
                    class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                ></div>
                Publishing...
            {:else}
                🚀 Publish
            {/if}
        </Button>
    </div>
</SiteHeader>
<div class="flex flex-1 flex-col">
    <ScrollArea
        class="@container/main flex flex-col gap-2 max-h-[calc(100dvh-80px)]"
    >
        <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div class="px-4 lg:px-6">
                {#if pages.length > 0}
                    <div class="mb-4">
                        <div class="text-sm text-muted-foreground">
                            {pages.length} page{pages.length === 1 ? "" : "s"}
                        </div>
                    </div>
                {/if}

                {#if loading}
                    <div class="text-center py-8 flex justify-center">
                        <Spinner />
                    </div>
                {:else if error}
                    <div class="text-red-500">{error}</div>
                {:else if pages.length === 0}
                    <div class="flex items-center justify-center min-h-[400px]">
                        <div class="text-center max-w-md">
                            <h3
                                class="text-lg font-extralight uppercase tracking-wider mb-2"
                            >
                                NO PAGES FOUND
                            </h3>
                            <p
                                class="text-muted-foreground font-extralight mb-6"
                            >
                                Get started by creating your first page
                            </p>
                        </div>
                    </div>
                {:else}
                    <div class="space-y-2">
                        {#each pageTree as node}
                            {@render PageTreeNode(node, 0)}
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </ScrollArea>
</div>

{#snippet PageTreeNode(node: PageNode, depth: number)}
    <div class="group">
        <div
            class="flex items-center gap-3 p-3 rounded-lg border bg-card/50 dark:bg-card/20 hover:bg-accent cursor-pointer dark:hover:bg-accent transition-all duration-200"
            style="margin-left: {depth * 20}px"
        >
            {#if node.children.length > 0}
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-6 w-6 p-0 hover:bg-accent"
                    onclick={() => toggleExpand(node)}
                >
                    {#if node.isExpanded}
                        <IconChevronDown class="h-3 w-3" />
                    {:else}
                        <IconChevronRight class="h-3 w-3" />
                    {/if}
                </Button>
            {:else}
                <div class="w-6"></div>
            {/if}

            <button
                class="flex-1 flex items-center justify-between min-w-0 text-left group-hover:bg-transparent"
                onclick={() => handlePageClick(node.page)}
                type="button"
            >
                <div class="min-w-0 flex-1 cursor-pointer">
                    <div
                        class="text-lg text-muted-foreground uppercase truncate w-fit"
                    >
                        {node.page.title}
                    </div>
                    <div
                        class="text-sm text-muted-foreground font-light truncate w-fit"
                    >
                        /{getFullSlug(node.page)}
                    </div>
                </div>

                <div class="flex items-center gap-3 ml-4 flex-shrink-0">
                    <div class="text-xs text-muted-foreground font-light">
                        {formatDateTime(node.page.updatedAt)}
                    </div>
                </div>
            </button>
        </div>

        {#if node.isExpanded && node.children.length > 0}
            <div class="mt-1 space-y-1" transition:slide={{ duration: 200 }}>
                {#each node.children as childNode}
                    {@render PageTreeNode(childNode, depth + 1)}
                {/each}
            </div>
        {/if}
    </div>
{/snippet}
