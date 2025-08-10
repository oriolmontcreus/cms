<script lang="ts">
  import SiteHeader from "$lib/components/site-header.svelte";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
</script>

<SiteHeader title="Dashboard" />
<div class="flex flex-1 flex-col">
  <ScrollArea
    class="@container/main flex flex-1 flex-col gap-2 max-h-[calc(100dvh-80px)]"
  >
    In progress</ScrollArea
  >
</div>
