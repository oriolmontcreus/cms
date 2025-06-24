<script lang="ts">
    import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
    import AlignLeftIcon from '@lucide/svelte/icons/align-left';
    import AlignCenterIcon from '@lucide/svelte/icons/align-center';
    import AlignRightIcon from '@lucide/svelte/icons/align-right';

    export let activeAlignment = '';
    export let disabled = false;
    export let onAlignmentChange: (alignment: string) => void;
</script>

<ToggleGroup.Root 
    variant="outline" 
    type="single" 
    value={activeAlignment}
    onValueChange={onAlignmentChange}
    {disabled}
>
    <ToggleGroup.Item value="left" aria-label="Align left" title="Align Left">
        <AlignLeftIcon class="h-4 w-4" />
    </ToggleGroup.Item>
    <ToggleGroup.Item value="center" aria-label="Align center" title="Align Center">
        <AlignCenterIcon class="h-4 w-4" />
    </ToggleGroup.Item>
    <ToggleGroup.Item value="right" aria-label="Align right" title="Align Right">
        <AlignRightIcon class="h-4 w-4" />
    </ToggleGroup.Item>
</ToggleGroup.Root> 