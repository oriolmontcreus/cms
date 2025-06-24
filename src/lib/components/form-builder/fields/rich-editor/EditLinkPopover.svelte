<script lang="ts">
    import { Button } from '@components/ui/button';
    import * as Popover from '$lib/components/ui/popover/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
    import TrashIcon from '@lucide/svelte/icons/trash';

    export let open = false;
    export let linkUrl = '';
    export let linkText = '';
    export let triggerElement: HTMLButtonElement;
    export let onUpdateLink: () => void;
    export let onVisitLink: () => void;
    export let onRemoveLink: () => void;
    export let onClose: () => void;
    export let onOpenChange: (isOpen: boolean) => void = () => {};
</script>

<Popover.Root bind:open onOpenChange={(isOpen) => onOpenChange(isOpen)}>
    <Popover.Trigger>
        <button class="hidden" bind:this={triggerElement}>Hidden Trigger</button>
    </Popover.Trigger>
    <Popover.Content class="w-80">
        <div class="grid gap-4">
            <div class="space-y-2">
                <h4 class="font-medium leading-none">Edit Link</h4>
                <p class="text-muted-foreground text-sm">
                    Modify the link or choose an action.
                </p>
            </div>
            <div class="grid gap-2">
                <div class="grid gap-2">
                    <Label for="edit-link-url">URL</Label>
                    <Input 
                        id="edit-link-url"
                        type="url"
                        bind:value={linkUrl}
                        placeholder="https://example.com"
                        class="h-8"
                    />
                </div>
                <div class="grid gap-2">
                    <Label for="edit-link-text">Link Text</Label>
                    <Input 
                        id="edit-link-text"
                        type="text"
                        bind:value={linkText}
                        placeholder="Link text"
                        class="h-8"
                    />
                </div>
            </div>
            <div class="flex justify-between">
                <div class="flex gap-1">
                    <Button type="button" variant="outline" size="sm" onclick={onVisitLink} title="Visit Link">
                        <ExternalLinkIcon class="h-3 w-3" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onclick={onRemoveLink} title="Remove Link">
                        <TrashIcon class="h-3 w-3" />
                    </Button>
                </div>
                <div class="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onclick={onClose}>
                        Cancel
                    </Button>
                    <Button type="button" size="sm" onclick={onUpdateLink} disabled={!linkUrl}>
                        Update Link
                    </Button>
                </div>
            </div>
        </div>
    </Popover.Content>
</Popover.Root> 