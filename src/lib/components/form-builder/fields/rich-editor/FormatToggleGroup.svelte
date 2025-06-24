<script lang="ts">
    import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
    import BoldIcon from '@lucide/svelte/icons/bold';
    import ItalicIcon from '@lucide/svelte/icons/italic';
    import UnderlineIcon from '@lucide/svelte/icons/underline';

    export let activeFormats: string[] = [];
    export let disabled = false;
    export let onFormatToggle: (formats: string[]) => void;
</script>

<ToggleGroup.Root 
    variant="outline" 
    type="multiple" 
    value={activeFormats}
    onValueChange={onFormatToggle}
    {disabled}
>
    <ToggleGroup.Item value="bold" aria-label="Toggle bold" title="Bold (Ctrl+B)">
        <BoldIcon class="h-4 w-4" />
    </ToggleGroup.Item>
    <ToggleGroup.Item value="italic" aria-label="Toggle italic" title="Italic (Ctrl+I)">
        <ItalicIcon class="h-4 w-4" />
    </ToggleGroup.Item>
    <ToggleGroup.Item value="underline" aria-label="Toggle underline" title="Underline (Ctrl+U)">
        <UnderlineIcon class="h-4 w-4" />
    </ToggleGroup.Item>
</ToggleGroup.Root> 