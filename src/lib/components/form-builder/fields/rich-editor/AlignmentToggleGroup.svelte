<script lang="ts">
    import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
    import AlignLeftIcon from "@lucide/svelte/icons/align-left";
    import AlignCenterIcon from "@lucide/svelte/icons/align-center";
    import AlignRightIcon from "@lucide/svelte/icons/align-right";

    export let activeAlignment = "";
    export let disabled = false;
    export let onAlignmentChange: (alignment: string) => void;
</script>

<ToggleGroup.Root
    variant="default"
    type="single"
    value={activeAlignment}
    onValueChange={onAlignmentChange}
    {disabled}
    class="h-8"
>
    <ToggleGroup.Item
        value="left"
        aria-label="Align left"
        title="Align Left"
        class="h-8 w-8 p-0"
    >
        <AlignLeftIcon class="h-3 w-3" />
    </ToggleGroup.Item>
    <ToggleGroup.Item
        value="center"
        aria-label="Align center"
        title="Align Center"
        class="h-8 w-8 p-0"
    >
        <AlignCenterIcon class="h-3 w-3" />
    </ToggleGroup.Item>
    <ToggleGroup.Item
        value="right"
        aria-label="Align right"
        title="Align Right"
        class="h-8 w-8 p-0"
    >
        <AlignRightIcon class="h-3 w-3" />
    </ToggleGroup.Item>
</ToggleGroup.Root>
