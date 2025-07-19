<script lang="ts">
    import FormBuilder from '$lib/components/form-builder/FormBuilder.svelte';
    import type { PageConfig } from '$lib/components/form-builder/types';
    import { RenderMode } from '$lib/components/form-builder/types';
    import { HeroComponent } from '@/components/Hero';
    import { Button } from "$lib/components/ui/button";
    import { IconLanguage, IconEdit, IconDeviceFloppy } from "@tabler/icons-svelte";

    // Mock data for testing
    const config: PageConfig = {
        title: "Test Page",
        slug: "test",
        components: [
            {
                component: HeroComponent,
                id: "hero-test",
                displayName: "Hero Component Test"
            }
        ]
    };

    const components = []; // Empty array for initial state

    let mode = RenderMode.CONTENT;
    let formBuilderRef: any = null;
    
    // Override handleSubmit to prevent backend calls
    const handleSubmit = async () => {
        console.log('Mock submit called - no backend interaction');
        console.log('Current mode:', mode);
        if (formBuilderRef) {
            console.log('Form data would be submitted');
        }
    };
</script>

<svelte:head>
    <title>Translation Mode Test</title>
</svelte:head>

<div class="flex h-screen flex-col">
    <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container flex h-14 items-center justify-between">
            <h1 class="text-lg font-semibold">Translation Mode Test</h1>
            
            <div class="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onclick={() => mode = mode === RenderMode.CONTENT ? RenderMode.TRANSLATION : RenderMode.CONTENT}
                >
                    {#if mode === RenderMode.TRANSLATION}
                        <IconEdit class="h-4 w-4 mr-2" />
                        Content Mode
                    {:else}
                        <IconLanguage class="h-4 w-4 mr-2" />
                        Translation Mode
                    {/if}
                </Button>
                
                <Button
                    type="button"
                    size="sm"
                    onclick={handleSubmit}
                >
                    <IconDeviceFloppy class="size-4" />
                    Save
                </Button>
            </div>
        </div>
    </header>

    <div class="flex flex-1 flex-col overflow-hidden">
        <div class="flex flex-1 flex-col gap-2 max-h-[calc(100dvh-80px)] overflow-auto">
            <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div class="px-4 lg:px-6">
                    <div class="max-w-4xl mx-auto">
                        <div class="mb-4 p-4 bg-muted/50 rounded-lg">
                            <p class="text-sm text-muted-foreground">
                                <strong>Current Mode:</strong> {mode === RenderMode.CONTENT ? 'Content' : 'Translation'}
                            </p>
                            <p class="text-sm text-muted-foreground mt-1">
                                {#if mode === RenderMode.TRANSLATION}
                                    Only fields marked with <code>.translatable()</code> should be visible.
                                {:else}
                                    All fields should be visible.
                                {/if}
                            </p>
                        </div>
                        
                        <FormBuilder 
                            bind:this={formBuilderRef}
                            {config} 
                            slug="test" 
                            {components}
                            {mode}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>