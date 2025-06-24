<script lang="ts">
    import type { FormField } from '../types';
    import { onMount } from 'svelte';
    import RichEditorToolbar from './rich-editor/RichEditorToolbar.svelte';
    import RichEditorContent from './rich-editor/RichEditorContent.svelte';
    import EditLinkPopover from './rich-editor/EditLinkPopover.svelte';
    import CharacterCounter from './rich-editor/CharacterCounter.svelte';

    export let field: FormField;
    export let fieldId: string;
    export let value: string = '';

    let editorRef: HTMLDivElement;
    let editLinkTrigger: HTMLButtonElement;
    let linkUrl = '';
    let linkText = '';
    let activeFormats: string[] = [];
    let activeAlignment = '';
    let linkPopoverOpen = false;
    let currentLinkElement: HTMLAnchorElement | null = null;
    
    // Separate state for editing existing links
    let editLinkPopoverOpen = false;
    let editLinkUrl = '';
    let editLinkText = '';
    
    // Store selection when popover opens
    let savedSelection: Range | null = null;

    onMount(() => {
        if (editorRef) {
            editorRef.addEventListener('input', handleInput);
            editorRef.addEventListener('paste', handlePaste);
            editorRef.addEventListener('mouseup', updateActiveFormats);
            editorRef.addEventListener('keyup', updateActiveFormats);
            editorRef.addEventListener('click', handleLinkClick);
            editorRef.addEventListener('keydown', handleLinkKeydown);
            document.addEventListener('selectionchange', updateActiveFormats);
        }
        
        return () => {
            if (editorRef) {
                editorRef.removeEventListener('input', handleInput);
                editorRef.removeEventListener('paste', handlePaste);
                editorRef.removeEventListener('mouseup', updateActiveFormats);
                editorRef.removeEventListener('keyup', updateActiveFormats);
                editorRef.removeEventListener('click', handleLinkClick);
                editorRef.removeEventListener('keydown', handleLinkKeydown);
                document.removeEventListener('selectionchange', updateActiveFormats);
            }
        };
    });

    function handleInput() {
        value = editorRef.innerHTML;
        
        // Make any new links focusable
        const links = editorRef.querySelectorAll('a');
        links.forEach(link => {
            if (!link.hasAttribute('tabindex')) {
                link.setAttribute('tabindex', '0');
            }
        });
        
        setTimeout(updateActiveFormats, 0);
    }

    function updateActiveFormats() {
        if (!editorRef || document.activeElement !== editorRef) return;
        
        const formats = [];
        if (document.queryCommandState('bold')) formats.push('bold');
        if (document.queryCommandState('italic')) formats.push('italic');
        if (document.queryCommandState('underline')) formats.push('underline');
        activeFormats = formats;

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
            
            if (editLinkTrigger) {
                const rect = linkElement.getBoundingClientRect();
                editLinkTrigger.style.position = 'absolute';
                editLinkTrigger.style.left = `${rect.left}px`;
                editLinkTrigger.style.top = `${rect.bottom}px`;
            }
            
            editLinkPopoverOpen = true;
        }
    }

    function handleLinkKeydown(e: KeyboardEvent) {
        if (field.readonly || field.disabled) return;
        
        if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target as HTMLElement;
            const linkElement = target.closest('a') as HTMLAnchorElement;
            
            if (linkElement && editorRef.contains(linkElement)) {
                e.preventDefault();
                e.stopPropagation();
                
                currentLinkElement = linkElement;
                editLinkUrl = linkElement.href;
                editLinkText = linkElement.textContent || '';
                
                if (editLinkTrigger) {
                    const rect = linkElement.getBoundingClientRect();
                    editLinkTrigger.style.position = 'absolute';
                    editLinkTrigger.style.left = `${rect.left}px`;
                    editLinkTrigger.style.top = `${rect.bottom}px`;
                }
                
                editLinkPopoverOpen = true;
            }
        }
    }

    function handleLinkPopoverOpenChange(isOpen: boolean) {
        if (isOpen) {
            const selection = window.getSelection();
            
            if (selection && selection.rangeCount > 0) {
                savedSelection = selection.getRangeAt(0).cloneRange();
                
                if (selection.toString()) {
                    linkText = selection.toString();
                } else {
                    linkText = '';
                }
            } else {
                savedSelection = null;
                linkText = '';
            }
            linkUrl = '';
        }
        linkPopoverOpen = isOpen;
    }

    function insertLink() {
        if (linkUrl) {
            if (savedSelection && savedSelection.toString()) {
                const displayText = linkText || savedSelection.toString();
                
                const selection = window.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(savedSelection);
                    
                    const linkElement = document.createElement('a');
                    linkElement.href = linkUrl;
                    linkElement.target = '_blank';
                    linkElement.tabIndex = 0;
                    linkElement.textContent = displayText;
                    
                    savedSelection.deleteContents();
                    savedSelection.insertNode(linkElement);
                    
                    selection.removeAllRanges();
                    const newRange = document.createRange();
                    newRange.setStartAfter(linkElement);
                    newRange.collapse(true);
                    selection.addRange(newRange);
                    
                    handleInput();
                }
            } else {
                const displayText = linkText || linkUrl;
                execCommand('insertHTML', `<a href="${linkUrl}" target="_blank" tabindex="0">${displayText}</a>`);
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
        savedSelection = null;
    }

    function closeEditLinkPopover() {
        editLinkPopoverOpen = false;
        editLinkUrl = '';
        editLinkText = '';
        currentLinkElement = null;
    }

    function handleKeydown(e: KeyboardEvent) {
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

    // Get editor reference from child component
    let richEditorContent: RichEditorContent;
    $: if (richEditorContent) {
        editorRef = richEditorContent.getEditorRef();
    }

    $: currentLength = value?.replace(/<[^>]*>/g, '').length || 0;
    $: maxLength = field.max;
    $: showCharCount = maxLength && maxLength > 0;
</script>

<div class="space-y-2">
    <RichEditorToolbar 
        {activeFormats}
        {activeAlignment}
        disabled={field.readonly || field.disabled}
        {linkPopoverOpen}
        bind:linkUrl
        bind:linkText
        onFormatToggle={handleFormatToggle}
        onAlignmentChange={handleAlignmentChange}
        onLinkPopoverOpenChange={handleLinkPopoverOpenChange}
        onInsertLink={insertLink}
        onCloseLinkPopover={closeLinkPopover}
    />

    <RichEditorContent 
        bind:this={richEditorContent}
        {field}
        {fieldId}
        bind:value
        showCharCount={!!showCharCount}
        onInput={handleInput}
        onPaste={handlePaste}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        onLinkClick={handleLinkClick}
        onLinkKeydown={handleLinkKeydown}
        onKeydown={handleKeydown}
    />

    <EditLinkPopover 
        open={editLinkPopoverOpen}
        bind:linkUrl={editLinkUrl}
        bind:linkText={editLinkText}
        bind:triggerElement={editLinkTrigger}
        onUpdateLink={updateExistingLink}
        onVisitLink={visitLink}
        onRemoveLink={removeLink}
        onClose={closeEditLinkPopover}
    />

    {#if showCharCount}
        <CharacterCounter 
            {fieldId}
            {currentLength}
            maxLength={maxLength || 0}
        />
    {/if}
</div>

 