<script lang="ts">
    import SiteHeader from "$lib/components/site-header.svelte";
    import SectionCards from "$lib/components/section-cards.svelte";
    import ChartAreaInteractive from "$lib/components/chart-area-interactive.svelte";
    import { ScrollArea } from "$lib/components/ui/scroll-area";
  </script>

  <SiteHeader title="Dashboard" />
  <div class="flex flex-1 flex-col">
    <ScrollArea class="@container/main flex flex-1 flex-col gap-2 max-h-[calc(100dvh-80px)]">
      <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div class="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
      </div>
    </ScrollArea>
  </div>