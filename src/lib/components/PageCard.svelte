<script lang="ts">
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import type { Page } from '@/lib/shared/types/pages.type';

    export let page: Page;
    export let onclick: () => void;
</script>

<Card 
    class="cursor-pointer transition-all duration-200 ease-in-out
           bg-white hover:bg-gray-50 
           dark:bg-neutral-900 dark:hover:bg-neutral-800 
           border border-neutral-200 hover:border-neutral-800
           dark:border-neutral-700 dark:hover:border-neutral-600"
    {onclick}
>
    <CardHeader>
        <CardTitle class="text-gray-900 dark:text-gray-100">{page.title}</CardTitle>
        <CardDescription class="text-gray-600 dark:text-gray-400">/{page.slug}</CardDescription>
        {#if page.components && page.components.length > 0}
            <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {page.components.length} component(s)
            </div>
        {/if}
    </CardHeader>
</Card> 