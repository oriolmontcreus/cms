<script lang="ts">
    import FormatToggleGroup from "./FormatToggleGroup.svelte";
    import AlignmentToggleGroup from "./AlignmentToggleGroup.svelte";
    import LinkPopover from "./LinkPopover.svelte";

    export let activeFormats: string[] = [];
    export let activeAlignment = "";
    export let disabled = false;
    export let linkPopoverOpen = false;
    export let linkUrl = "";
    export let linkText = "";

    export let onFormatToggle: (formats: string[]) => void;
    export let onAlignmentChange: (alignment: string) => void;
    export let onLinkPopoverOpenChange: (isOpen: boolean) => void;
    export let onInsertLink: () => void;
    export let onCloseLinkPopover: () => void;
</script>

<div class="flex flex-wrap items-center gap-1 py-1 bg-transparent">
    <!-- Format toggle group -->
    <FormatToggleGroup {activeFormats} {disabled} {onFormatToggle} />

    <!-- Alignment toggle group -->
    <AlignmentToggleGroup {activeAlignment} {disabled} {onAlignmentChange} />

    <!-- Link popover -->
    <LinkPopover
        open={linkPopoverOpen}
        {disabled}
        bind:linkUrl
        bind:linkText
        onOpenChange={onLinkPopoverOpenChange}
        {onInsertLink}
        onClose={onCloseLinkPopover}
    />
</div>
