<script lang="ts">
    import { Button } from '@components/ui/button';
    import * as Popover from '$lib/components/ui/popover/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import LinkIcon from '@lucide/svelte/icons/link';

    export let open = false;
    export let disabled = false;
    export let linkUrl = '';
    export let linkText = '';
    export let onOpenChange: (isOpen: boolean) => void;
    export let onInsertLink: () => void;
    export let onClose: () => void;
</script>

<Popover.Root bind:open onOpenChange={(isOpen) => onOpenChange(isOpen)}>
    <Popover.Trigger>
        <Button
            type="button"
            variant="outline"
            size="sm"
            class="h-9 px-3"
            {disabled}
            title="Insert Link (Ctrl+K)"
        >
            <LinkIcon class="h-4 w-4" />
        </Button>
    </Popover.Trigger>
    <Popover.Content class="w-80">
        <div class="grid gap-4">
            <div class="space-y-2">
                <h4 class="font-medium leading-none">Insert Link</h4>
                <p class="text-muted-foreground text-sm">
                    Add a link to your content.
                </p>
            </div>
            <div class="grid gap-2">
                <div class="grid gap-2">
                    <Label for="link-url">URL</Label>
                    <Input 
                        id="link-url"
                        type="url"
                        bind:value={linkUrl}
                        placeholder="https://example.com"
                        class="h-8"
                    />
                </div>
                <div class="grid gap-2">
                    <Label for="link-text">Link Text (optional)</Label>
                    <Input 
                        id="link-text"
                        type="text"
                        bind:value={linkText}
                        placeholder="Link text"
                        class="h-8"
                    />
                </div>
            </div>
            <div class="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onclick={onClose}>
                    Cancel
                </Button>
                <Button type="button" size="sm" onclick={onInsertLink} disabled={!linkUrl}>
                    Insert Link
                </Button>
            </div>
        </div>
    </Popover.Content>
</Popover.Root> 