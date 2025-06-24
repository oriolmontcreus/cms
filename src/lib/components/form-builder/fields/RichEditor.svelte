<script lang="ts">
    import type { FormField } from '../types';
    import { Button } from '@components/ui/button';
    import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
    import * as Popover from '$lib/components/ui/popover/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import BoldIcon from '@lucide/svelte/icons/bold';
    import ItalicIcon from '@lucide/svelte/icons/italic';
    import UnderlineIcon from '@lucide/svelte/icons/underline';
    import AlignLeftIcon from '@lucide/svelte/icons/align-left';
    import AlignCenterIcon from '@lucide/svelte/icons/align-center';
    import AlignRightIcon from '@lucide/svelte/icons/align-right';
    import LinkIcon from '@lucide/svelte/icons/link';
    import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
    import EditIcon from '@lucide/svelte/icons/edit';
    import TrashIcon from '@lucide/svelte/icons/trash';
    import { onMount } from 'svelte';

    export let field: FormField;
    export let fieldId: string;
    export let value: string = '';

    let editorRef: HTMLDivElement;
    let linkUrl = '';
    let linkText = '';
    let activeFormats: string[] = [];
    let activeAlignment = '';
    let linkPopoverOpen = false;
    let editingExistingLink = false;
    let currentLinkElement: HTMLAnchorElement | null = null;
    
    // Separate state for editing existing links
    let editLinkPopoverOpen = false;
    let editLinkUrl = '';
    let editLinkText = '';

    onMount(() => {
        if (editorRef) {
            editorRef.innerHTML = value || '';
            editorRef.addEventListener('input', handleInput);
            editorRef.addEventListener('paste', handlePaste);
            editorRef.addEventListener('mouseup', updateActiveFormats);
            editorRef.addEventListener('keyup', updateActiveFormats);
            editorRef.addEventListener('click', handleLinkClick);
            document.addEventListener('selectionchange', updateActiveFormats);
        }
        
        return () => {
            if (editorRef) {
                editorRef.removeEventListener('input', handleInput);
                editorRef.removeEventListener('paste', handlePaste);
                editorRef.removeEventListener('mouseup', updateActiveFormats);
                editorRef.removeEventListener('keyup', updateActiveFormats);
                editorRef.removeEventListener('click', handleLinkClick);
                document.removeEventListener('selectionchange', updateActiveFormats);
            }
        };
    });

    function handleInput() {
        value = editorRef.innerHTML;
        setTimeout(updateActiveFormats, 0); // Delay to ensure DOM is updated
    }

    function updateActiveFormats() {
        if (!editorRef || document.activeElement !== editorRef) return;
        
        const formats = [];
        if (document.queryCommandState('bold')) formats.push('bold');
        if (document.queryCommandState('italic')) formats.push('italic');
        if (document.queryCommandState('underline')) formats.push('underline');
        activeFormats = formats;

        // Update alignment
        if (document.queryCommandState('justifyLeft')) {
            activeAlignment = 'left';
        } else if (document.queryCommandState('justifyCenter')) {
            activeAlignment = 'center';
        } else if (document.queryCommandState('justifyRight')) {
            activeAlignment = 'right';
        } else {
            activeAlignment = '';
        }
    }

    function handlePaste(e: ClipboardEvent) {
        e.preventDefault();
        const text = e.clipboardData?.getData('text/plain') || '';
        document.execCommand('insertText', false, text);
    }

    function execCommand(command: string, value?: string) {
        if (field.readonly || field.disabled) return;
        
        editorRef.focus();
        document.execCommand(command, false, value);
        handleInput();
    }

    function ensureEditorFocus() {
        if (editorRef && document.activeElement !== editorRef) {
            editorRef.focus();
            // Restore cursor position if needed
            const selection = window.getSelection();
            if (selection && selection.rangeCount === 0) {
                const range = document.createRange();
                range.selectNodeContents(editorRef);
                range.collapse(false);
                selection.addRange(range);
            }
        }
    }

    function handleFormatToggle(formats: string[]) {
        if (field.readonly || field.disabled) return;
        
        ensureEditorFocus();
        
        // Apply or remove each format based on the new state
        ['bold', 'italic', 'underline'].forEach(format => {
            const isCurrentlyActive = document.queryCommandState(format);
            const shouldBeActive = formats.includes(format);
            
            if (isCurrentlyActive !== shouldBeActive) {
                document.execCommand(format, false);
            }
        });
        
        handleInput();
    }

    function handleAlignmentChange(alignment: string) {
        if (field.readonly || field.disabled) return;
        
        if (alignment && alignment !== activeAlignment) {
            ensureEditorFocus();
            switch (alignment) {
                case 'left':
                    document.execCommand('justifyLeft', false);
                    break;
                case 'center':
                    document.execCommand('justifyCenter', false);
                    break;
                case 'right':
                    document.execCommand('justifyRight', false);
                    break;
            }
            activeAlignment = alignment;
            handleInput();
        }
    }

    function handleLinkClick(e: MouseEvent) {
        if (field.readonly || field.disabled) return;
        
        const target = e.target as HTMLElement;
        const linkElement = target.closest('a') as HTMLAnchorElement;
        
        if (linkElement && editorRef.contains(linkElement)) {
            e.preventDefault();
            e.stopPropagation();
            
            currentLinkElement = linkElement;
            editLinkUrl = linkElement.href;
            editLinkText = linkElement.textContent || '';
            editLinkPopoverOpen = true;
        }
    }

    function openLinkPopover() {
        const selection = window.getSelection();
        if (selection && selection.toString()) {
            linkText = selection.toString();
        } else {
            linkText = '';
        }
        linkUrl = '';
    }

    function insertLink() {
        if (linkUrl) {
            // Insert new link
            if (linkText) {
                execCommand('insertHTML', `<a href="${linkUrl}" target="_blank">${linkText}</a>`);
            } else {
                execCommand('insertHTML', `<a href="${linkUrl}" target="_blank">${linkUrl}</a>`);
            }
        }
        closeLinkPopover();
    }

    function updateExistingLink() {
        if (editLinkUrl && currentLinkElement) {
            currentLinkElement.href = editLinkUrl;
            currentLinkElement.textContent = editLinkText || editLinkUrl;
            handleInput();
        }
        closeEditLinkPopover();
    }

    function visitLink() {
        if (editLinkUrl) {
            window.open(editLinkUrl, '_blank');
        }
        closeEditLinkPopover();
    }

    function removeLink() {
        if (currentLinkElement) {
            const textContent = currentLinkElement.textContent || '';
            currentLinkElement.outerHTML = textContent;
            handleInput();
        }
        closeEditLinkPopover();
    }

    function closeLinkPopover() {
        linkPopoverOpen = false;
        linkUrl = '';
        linkText = '';
    }

    function closeEditLinkPopover() {
        editLinkPopoverOpen = false;
        editLinkUrl = '';
        editLinkText = '';
        currentLinkElement = null;
    }

    function handleKeydown(e: KeyboardEvent) {
        // Handle common keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    execCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    execCommand('underline');
                    break;
                case 'k':
                    e.preventDefault();
                    linkPopoverOpen = true;
                    break;
            }
        }
    }

    $: currentLength = value?.replace(/<[^>]*>/g, '').length || 0;
    $: maxLength = field.max;
    $: showCharCount = maxLength && maxLength > 0;
</script>

<div class="space-y-2">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2 p-2 border rounded-t-md bg-muted/50">
        <!-- Format toggle group -->
        <ToggleGroup.Root 
            variant="outline" 
            type="multiple" 
            value={activeFormats}
            onValueChange={handleFormatToggle}
            disabled={field.readonly || field.disabled}
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

        <!-- Separator -->
        <div class="w-px h-6 bg-border"></div>

        <!-- Alignment toggle group -->
        <ToggleGroup.Root 
            variant="outline" 
            type="single" 
            value={activeAlignment}
            onValueChange={handleAlignmentChange}
            disabled={field.readonly || field.disabled}
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

        <!-- Separator -->
        <div class="w-px h-6 bg-border"></div>

        <!-- Link popover -->
        <Popover.Root bind:open={linkPopoverOpen} onOpenChange={(open) => { if (open) openLinkPopover(); }}>
            <Popover.Trigger>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    class="h-9 px-3"
                    disabled={field.readonly || field.disabled}
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
                        <Button type="button" variant="outline" size="sm" onclick={closeLinkPopover}>
                            Cancel
                        </Button>
                        <Button type="button" size="sm" onclick={insertLink} disabled={!linkUrl}>
                            Insert Link
                        </Button>
                    </div>
                </div>
            </Popover.Content>
        </Popover.Root>
    </div>

    <!-- Edit Link Popover (appears when clicking on existing links) -->
    {#if editLinkPopoverOpen}
        <div class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="fixed inset-0 bg-black/20" onclick={closeEditLinkPopover}></div>
            <div class="relative bg-background border rounded-lg shadow-lg w-80 p-4 z-50">
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
                                bind:value={editLinkUrl}
                                placeholder="https://example.com"
                                class="h-8"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label for="edit-link-text">Link Text</Label>
                            <Input 
                                id="edit-link-text"
                                type="text"
                                bind:value={editLinkText}
                                placeholder="Link text"
                                class="h-8"
                            />
                        </div>
                    </div>
                    <div class="flex justify-between">
                        <div class="flex gap-1">
                            <Button type="button" variant="outline" size="sm" onclick={visitLink} title="Visit Link">
                                <ExternalLinkIcon class="h-3 w-3" />
                            </Button>
                            <Button type="button" variant="outline" size="sm" onclick={removeLink} title="Remove Link">
                                <TrashIcon class="h-3 w-3" />
                            </Button>
                        </div>
                        <div class="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onclick={closeEditLinkPopover}>
                                Cancel
                            </Button>
                            <Button type="button" size="sm" onclick={updateExistingLink} disabled={!editLinkUrl}>
                                Update Link
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Editor -->
    <div
        bind:this={editorRef}
        contenteditable={!field.readonly && !field.disabled}
        class="min-h-32 p-3 border border-t-0 rounded-b-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rich-editor [&_a]:underline [&_a]:decoration-gray-400 [&_a]:underline-offset-2 [&_a]:text-blue-600 [&_a]:hover:text-blue-700 [&_a]:hover:decoration-blue-600 [&_a]:transition-colors [&_a]:cursor-pointer [&_a]:rounded-sm [&_a]:px-1 [&_a]:py-0.5 [&_a]:mx-0.5 [&_a]:bg-blue-50 [&_a]:hover:bg-blue-100 [&_a]:border [&_a]:border-transparent [&_a]:hover:border-blue-200 dark:[&_a]:text-blue-400 dark:[&_a]:hover:text-blue-300 dark:[&_a]:decoration-gray-500 dark:[&_a]:hover:decoration-blue-400 dark:[&_a]:bg-blue-950/30 dark:[&_a]:hover:bg-blue-900/40 dark:[&_a]:hover:border-blue-700"
        class:opacity-50={field.disabled}
        class:cursor-not-allowed={field.disabled}
        style="min-height: {field.rows ? field.rows * 1.5 : 8}rem;"
        placeholder={field.placeholder}
        aria-describedby={showCharCount ? `${fieldId}-characters-left` : undefined}
        onkeydown={handleKeydown}
        role="textbox"
        aria-multiline="true"
        aria-label={field.label}
        tabindex="0"
    ></div>

    {#if showCharCount}
        <p
            id="{fieldId}-characters-left"
            class="text-muted-foreground mt-2 text-right text-xs"
            role="status"
            aria-live="polite"
        >
            <span class="tabular-nums">{currentLength}/{maxLength}</span>
        </p>
    {/if}
</div>

 