<script lang="ts">
    import FormBuilder from "$lib/components/form-builder/FormBuilder.svelte";
    import type { PageConfig } from "$lib/components/form-builder/types";
    import { RenderMode } from "$lib/components/form-builder/types";
    import { onMount } from "svelte";
    import SiteHeader from "$lib/components/site-header.svelte";
    import { ScrollArea } from "$lib/components/ui/scroll-area";
    import { Button } from "$lib/components/ui/button";
    import {
        IconLanguage,
        IconEdit,
        IconDeviceFloppy,
        IconVariable,
    } from "@tabler/icons-svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import { GlobalVariables } from "@/components/GlobalVariables";
    import type { Component } from "@/lib/shared/types/pages.type";

    let config: PageConfig | null = null;
    let components: Component[] = [];
    let loading = true;
    let error: string | null = null;
    let mode = RenderMode.CONTENT;
    let formBuilderRef: any = null;
    let isSubmitting = false;

    // Create the config for global variables
    const globalVariablesConfig: PageConfig = {
        title: "Global Variables",
        slug: "global-variables",
        components: [
            {
                component: GlobalVariables,
                id: "global-variables-main",
                displayName: "GLOBAL VARIABLES",
            },
        ],
    };

    onMount(async () => {
        loading = true;
        try {
            // For now, we'll create a mock structure
            // In a real implementation, you'd load this from your backend
            config = globalVariablesConfig;
            components = [
                {
                    componentName: "GlobalVariables",
                    instanceId: "global-variables-main",
                    displayName: "GLOBAL VARIABLES",
                    formData: {},
                },
            ];
            loading = false;
        } catch (err) {
            error = "Failed to load global variables";
            loading = false;
        }
    });

    async function handleSave() {
        if (formBuilderRef) {
            isSubmitting = true;
            try {
                await formBuilderRef.handleSubmit(
                    mode === RenderMode.TRANSLATION,
                );
                // Here you would save to your global variables endpoint
                console.log("Global variables saved successfully");
            } catch (err) {
                console.error("Failed to save global variables:", err);
            } finally {
                isSubmitting = false;
            }
        }
    }
</script>

<SiteHeader title="Global Variables">
    <div class="flex items-center gap-2">
        <div class="flex rounded-md border bg-background">
            <Button
                variant={mode === RenderMode.CONTENT ? "secondary" : "ghost"}
                size="sm"
                class={`h-8 px-2 sm:px-3 rounded-e-none ${mode === RenderMode.CONTENT ? "" : "bg-white dark:bg-transparent"}`}
                onclick={() => (mode = RenderMode.CONTENT)}
            >
                <IconEdit class="h-4 w-4 sm:mr-2" />
                <span class="hidden sm:inline">Content</span>
            </Button>
            <Button
                variant={mode === RenderMode.TRANSLATION
                    ? "secondary"
                    : "ghost"}
                size="sm"
                class={`h-8 px-2 sm:px-3 rounded-s-none ${mode === RenderMode.TRANSLATION ? "" : "bg-white dark:bg-transparent"}`}
                onclick={() => (mode = RenderMode.TRANSLATION)}
            >
                <IconLanguage class="h-4 w-4 sm:mr-2" />
                <span class="hidden sm:inline">Translations</span>
            </Button>
        </div>

        {#if config}
            <Button
                type="button"
                size="sm"
                onclick={handleSave}
                disabled={isSubmitting}
            >
                <IconDeviceFloppy class="size-4" />
                <span class="hidden sm:inline ml-2">Save</span>
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
                        <Spinner />
                    </div>
                {:else if error}
                    <div class="max-w-2xl mx-auto py-8">
                        <div class="text-red-500 text-center">{error}</div>
                    </div>
                {:else if config}
                    <div class="max-w-4xl mx-auto">
                        <div class="mb-6">
                            <h1 class="text-2xl font-bold mb-2">
                                Global Variables
                            </h1>
                            <p class="text-muted-foreground">
                                Configure global variables that will be
                                available across your entire site. These
                                settings can be used in components, pages, and
                                templates.
                            </p>
                        </div>
                        <FormBuilder
                            bind:this={formBuilderRef}
                            {config}
                            slug="global-variables"
                            {components}
                            {mode}
                            bind:isSubmitting
                        />
                    </div>
                {:else}
                    <div class="max-w-2xl mx-auto py-8">
                        <div class="text-center text-gray-500">
                            Failed to load global variables configuration
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </ScrollArea>
</div>
