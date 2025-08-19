<script lang="ts">
    import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
    import BoldIcon from "@lucide/svelte/icons/bold";
    import ItalicIcon from "@lucide/svelte/icons/italic";
    import UnderlineIcon from "@lucide/svelte/icons/underline";

    export let activeFormats: string[] = [];
    export let disabled = false;
    export let onFormatToggle: (formats: string[]) => void;
</script>

<ToggleGroup.Root
    variant="default"
    type="multiple"
    value={activeFormats}
    onValueChange={onFormatToggle}
    {disabled}
    class="h-8"
>
    <ToggleGroup.Item
        value="bold"
        aria-label="Toggle bold"
        title="Bold (Ctrl+B)"
        class="h-8 w-8 p-0"
    >
        <BoldIcon class="h-3 w-3" />
    </ToggleGroup.Item>
    <ToggleGroup.Item
        value="italic"
        aria-label="Toggle italic"
        title="Italic (Ctrl+I)"
        class="h-8 w-8 p-0"
    >
        <ItalicIcon class="h-3 w-3" />
    </ToggleGroup.Item>
    <ToggleGroup.Item
        value="underline"
        aria-label="Toggle underline"
        title="Underline (Ctrl+U)"
        class="h-8 w-8 p-0"
    >
        <UnderlineIcon class="h-3 w-3" />
    </ToggleGroup.Item>
</ToggleGroup.Root>
