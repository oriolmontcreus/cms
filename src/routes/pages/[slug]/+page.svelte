<script lang="ts">
    import { page } from "$app/state";
    import FormBuilder from "$lib/components/form-builder/FormBuilder.svelte";
    import type { PageConfig } from "$lib/components/form-builder/types";
    import { RenderMode } from "$lib/components/form-builder/types";
    import { getPageBySlug } from "@/services/page.service";
    import type { Page } from "@/lib/shared/types/pages.type";
    import { onMount } from "svelte";
    import SiteHeader from "$lib/components/site-header.svelte";
    import { safeFetch } from "@/lib/utils/safeFetch";
    import { ScrollArea } from "$lib/components/ui/scroll-area";
    import { Button } from "$lib/components/ui/button";
    import {
        IconLanguage,
        IconEdit,
        IconDeviceFloppy,
    } from "@tabler/icons-svelte";

    let pageData: Page | null = null;
    let config: PageConfig | null = null;
    let loading = true;
    let error: string | null = null;
    let mode = RenderMode.CONTENT;
    let formBuilderRef: any = null;

    onMount(async () => {
        loading = true;
        const slug = page.params.slug;
        const [data, err] = await safeFetch(getPageBySlug(slug));
        loading = false;
        if (data) {
            pageData = data;
            config = data.config as PageConfig;
        } else {
            error = "Page not found or no configuration available";
        }
    });
</script>

<SiteHeader title={config?.title || "Page"}>
    <div class="flex items-center gap-2">
        <div class="flex rounded-lg border bg-background">
            <Button
                variant={mode === RenderMode.CONTENT ? "secondary" : "ghost"}
                size="sm"
                class="h-8 px-3 rounded-e-none"
                onclick={() => (mode = RenderMode.CONTENT)}
            >
                <IconEdit class="h-4 w-4 mr-2" />
                Content
            </Button>
            <Button
                variant={mode === RenderMode.TRANSLATION
                    ? "secondary"
                    : "ghost"}
                size="sm"
                class="h-8 px-3 rounded-s-none"
                onclick={() => (mode = RenderMode.TRANSLATION)}
            >
                <IconLanguage class="h-4 w-4 mr-2" />
                Translations
            </Button>
        </div>

        {#if config && pageData}
            <Button
                type="button"
                size="sm"
                onclick={() => formBuilderRef?.handleSubmit()}
                disabled={formBuilderRef?.isSubmitting}
            >
                <IconDeviceFloppy class="size-4" />
            </Button>
        {/if}
    </div>
</SiteHeader>
<div class="flex flex-1 flex-col overflow-hidden">
    <ScrollArea
        class="@container/main flex flex-1 flex-col gap-2 max-h-[calc(100dvh-80px)]"
    >
        <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div class="px-4 lg:px-6">
                {#if loading}
                    <div class="flex items-center justify-center min-h-[200px]">
                        <div
                            class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
                        ></div>
                    </div>
                {:else if error}
                    <div class="max-w-2xl mx-auto py-8">
                        <div class="text-red-500 text-center">{error}</div>
                    </div>
                {:else if config && pageData}
                    <div class="max-w-4xl mx-auto">
                        <FormBuilder
                            bind:this={formBuilderRef}
                            {config}
                            slug={pageData.slug}
                            components={pageData.components}
                            {mode}
                        />
                    </div>
                {:else}
                    <div class="max-w-2xl mx-auto py-8">
                        <div class="text-center text-gray-500">
                            Page not found
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </ScrollArea>
</div>
