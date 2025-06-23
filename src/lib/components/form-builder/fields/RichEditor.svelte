<script lang="ts">
    import type { FormField } from '../types';
    import { Button } from '@components/ui/button';
    import { onMount } from 'svelte';

    export let field: FormField;
    export let fieldId: string;
    export let value: string = '';

    let editorRef: HTMLDivElement;
    let isLinkModalOpen = false;
    let linkUrl = '';
    let linkText = '';

    onMount(() => {
        if (editorRef) {
            editorRef.innerHTML = value || '';
            editorRef.addEventListener('input', handleInput);
            editorRef.addEventListener('paste', handlePaste);
        }
        
        return () => {
            if (editorRef) {
                editorRef.removeEventListener('input', handleInput);
                editorRef.removeEventListener('paste', handlePaste);
            }
        };
    });

    function handleInput() {
        value = editorRef.innerHTML;
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

    function toggleFormat(command: string) {
        execCommand(command);
    }

    function setAlignment(alignment: string) {
        execCommand(`justify${alignment}`);
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
                    toggleFormat('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    toggleFormat('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    toggleFormat('underline');
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
    <div class="flex flex-wrap gap-1 p-2 border rounded-t-md bg-muted/50">
        <!-- Format buttons -->
        <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-8 px-2"
            disabled={field.readonly || field.disabled}
            onclick={() => toggleFormat('bold')}
            title="Bold (Ctrl+B)"
        >
            <span class="font-bold">B</span>
        </Button>
        
        <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-8 px-2"
            disabled={field.readonly || field.disabled}
            onclick={() => toggleFormat('italic')}
            title="Italic (Ctrl+I)"
        >
            <span class="italic">I</span>
        </Button>
        
        <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-8 px-2"
            disabled={field.readonly || field.disabled}
            onclick={() => toggleFormat('underline')}
            title="Underline (Ctrl+U)"
        >
            <span class="underline">U</span>
        </Button>

        <!-- Separator -->
        <div class="w-px h-6 bg-border mx-1"></div>

        <!-- Alignment buttons -->
        <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-8 px-2"
            disabled={field.readonly || field.disabled}
            onclick={() => setAlignment('Left')}
            title="Align Left"
        >
            ⬅
        </Button>
        
        <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-8 px-2"
            disabled={field.readonly || field.disabled}
            onclick={() => setAlignment('Center')}
            title="Align Center"
        >
            ↔
        </Button>
        
        <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-8 px-2"
            disabled={field.readonly || field.disabled}
            onclick={() => setAlignment('Right')}
            title="Align Right"
        >
            ➡
        </Button>

        <!-- Separator -->
        <div class="w-px h-6 bg-border mx-1"></div>

        <!-- Link button -->
        <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-8 px-2"
            disabled={field.readonly || field.disabled}
            onclick={openLinkModal}
            title="Insert Link (Ctrl+K)"
        >
            🔗
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