<script lang="ts">
    import type { FormField } from '../types';
    import { Button } from '@components/ui/button';
    import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
    import BoldIcon from '@lucide/svelte/icons/bold';
    import ItalicIcon from '@lucide/svelte/icons/italic';
    import UnderlineIcon from '@lucide/svelte/icons/underline';
    import AlignLeftIcon from '@lucide/svelte/icons/align-left';
    import AlignCenterIcon from '@lucide/svelte/icons/align-center';
    import AlignRightIcon from '@lucide/svelte/icons/align-right';
    import LinkIcon from '@lucide/svelte/icons/link';
    import { onMount } from 'svelte';

    export let field: FormField;
    export let fieldId: string;
    export let value: string = '';

    let editorRef: HTMLDivElement;
    let isLinkModalOpen = false;
    let linkUrl = '';
    let linkText = '';
    let activeFormats: string[] = [];
    let activeAlignment = '';

    onMount(() => {
        if (editorRef) {
            editorRef.innerHTML = value || '';
            editorRef.addEventListener('input', handleInput);
            editorRef.addEventListener('paste', handlePaste);
            editorRef.addEventListener('mouseup', updateActiveFormats);
            editorRef.addEventListener('keyup', updateActiveFormats);
            document.addEventListener('selectionchange', updateActiveFormats);
        }
        
        return () => {
            if (editorRef) {
                editorRef.removeEventListener('input', handleInput);
                editorRef.removeEventListener('paste', handlePaste);
                editorRef.removeEventListener('mouseup', updateActiveFormats);
                editorRef.removeEventListener('keyup', updateActiveFormats);
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

    function openLinkModal() {
        const selection = window.getSelection();
        if (selection && selection.toString()) {
            linkText = selection.toString();
        }
        isLinkModalOpen = true;
    }

    function insertLink() {
        if (linkUrl) {
            if (linkText) {
                // If we have selected text, replace it with the link
                execCommand('insertHTML', `<a href="${linkUrl}" target="_blank">${linkText}</a>`);
            } else {
                // If no text is selected, insert the URL as both href and text
                execCommand('insertHTML', `<a href="${linkUrl}" target="_blank">${linkUrl}</a>`);
            }
        }
        closeLinkModal();
    }

    function closeLinkModal() {
        isLinkModalOpen = false;
        linkUrl = '';
        linkText = '';
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
                    openLinkModal();
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

        <!-- Link button -->
        <Button
            type="button"
            variant="outline"
            size="sm"
            class="h-9 px-3"
            disabled={field.readonly || field.disabled}
            onclick={openLinkModal}
            title="Insert Link (Ctrl+K)"
        >
            <LinkIcon class="h-4 w-4" />
        </Button>
    </div>

    <!-- Editor -->
    <div
        bind:this={editorRef}
        contenteditable={!field.readonly && !field.disabled}
        class="min-h-32 p-3 border border-t-0 rounded-b-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        class:opacity-50={field.disabled}
        class:cursor-not-allowed={field.disabled}
        style="min-height: {field.rows ? field.rows * 1.5 : 8}rem;"
        placeholder={field.placeholder}
        aria-describedby={showCharCount ? `${fieldId}-characters-left` : undefined}
        onkeydown={handleKeydown}
        role="textbox"
        aria-multiline="true"
        aria-label={field.label}
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

<!-- Link Modal -->
{#if isLinkModalOpen}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={closeLinkModal}>
        <div class="bg-background p-6 rounded-lg shadow-lg w-96" onclick={(e) => e.stopPropagation()}>
            <h3 class="text-lg font-semibold mb-4">Insert Link</h3>
            
            <div class="space-y-4">
                <div>
                    <label for="link-url" class="block text-sm font-medium mb-1">URL</label>
                    <input
                        id="link-url"
                        type="url"
                        bind:value={linkUrl}
                        placeholder="https://example.com"
                        class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                    />
                </div>
                
                <div>
                    <label for="link-text" class="block text-sm font-medium mb-1">Link Text (optional)</label>
                    <input
                        id="link-text"
                        type="text"
                        bind:value={linkText}
                        placeholder="Link text"
                        class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>
            
            <div class="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onclick={closeLinkModal}>
                    Cancel
                </Button>
                <Button type="button" onclick={insertLink} disabled={!linkUrl}>
                    Insert Link
                </Button>
            </div>
        </div>
    </div>
{/if} 