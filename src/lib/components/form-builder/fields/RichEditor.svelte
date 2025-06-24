<script lang="ts">
    import type { FormField } from '../types';
    import { onMount } from 'svelte';
    import RichEditorToolbar from './rich-editor/RichEditorToolbar.svelte';
    import RichEditorContent from './rich-editor/RichEditorContent.svelte';
    import EditLinkPopover from './rich-editor/EditLinkPopover.svelte';

    // Constants
    const FORMATS = ['bold', 'italic', 'underline'] as const;
    const ALIGNMENTS = {
        left: 'justifyLeft',
        center: 'justifyCenter',
        right: 'justifyRight'
    } as const;
    const KEYBOARD_SHORTCUTS = {
        'b': 'bold',
        'i': 'italic',
        'u': 'underline',
        'k': 'link'
    } as const;

    export let field: FormField;
    export let fieldId: string;
    export let value: string = '';

    // Editor state
    let editorRef: HTMLDivElement;
    let richEditorContent: RichEditorContent;
    let activeFormats: string[] = [];
    let activeAlignment = '';

    // Link state
    let linkUrl = '';
    let linkText = '';
    let linkPopoverOpen = false;
    let savedSelection: Range | null = null;

    // Edit link state
    let editLinkTrigger: HTMLButtonElement;
    let editLinkPopoverOpen = false;
    let editLinkUrl = '';
    let editLinkText = '';
    let currentLinkElement: HTMLAnchorElement | null = null;

    // Computed properties
    $: isReadonly = field.readonly || field.disabled;
    $: currentLength = value?.replace(/<[^>]*>/g, '').length || 0;
    $: maxLength = field.max;
    $: showCharCount = maxLength && maxLength > 0;
    $: if (richEditorContent) editorRef = richEditorContent.getEditorRef();

    // Utility functions
    const getEventListeners = () => [
        ['input', handleInput],
        ['paste', handlePaste],
        ['mouseup', updateActiveFormats],
        ['keyup', updateActiveFormats],
        ['click', handleLinkClick],
        ['keydown', handleLinkKeydown]
    ] as const;

    const addEventListeners = () => {
        if (!editorRef) return;
        
        getEventListeners().forEach(([event, handler]) => {
            editorRef.addEventListener(event, handler as EventListener);
        });
        document.addEventListener('selectionchange', updateActiveFormats);
    };

    const removeEventListeners = () => {
        if (!editorRef) return;
        
        getEventListeners().forEach(([event, handler]) => {
            editorRef.removeEventListener(event, handler as EventListener);
        });
        document.removeEventListener('selectionchange', updateActiveFormats);
    };

    const ensureEditorFocus = () => {
        if (!editorRef || document.activeElement === editorRef) return;
        
        editorRef.focus();
        const selection = window.getSelection();
        if (selection && selection.rangeCount === 0) {
            const range = document.createRange();
            range.selectNodeContents(editorRef);
            range.collapse(false);
            selection.addRange(range);
        }
    };

    const makeLinksFocusable = () => {
        const links = editorRef.querySelectorAll('a:not([tabindex])');
        links.forEach(link => link.setAttribute('tabindex', '0'));
    };

    const getActiveFormats = () => {
        return FORMATS.filter(format => document.queryCommandState(format));
    };

    const getActiveAlignment = () => {
        const alignmentEntry = Object.entries(ALIGNMENTS)
            .find(([_, command]) => document.queryCommandState(command));
        return alignmentEntry?.[0] || '';
    };

    const positionPopover = (element: HTMLElement, trigger: HTMLButtonElement) => {
        const rect = element.getBoundingClientRect();
        trigger.style.position = 'absolute';
        trigger.style.left = `${rect.left}px`;
        trigger.style.top = `${rect.bottom}px`;
    };

    const resetLinkPopoverState = () => {
        linkPopoverOpen = false;
        linkUrl = '';
        linkText = '';
        savedSelection = null;
    };

    const resetEditLinkPopoverState = () => {
        editLinkPopoverOpen = false;
        editLinkUrl = '';
        editLinkText = '';
        currentLinkElement = null;
    };

    const prepareEditLinkState = (linkElement: HTMLAnchorElement) => {
        currentLinkElement = linkElement;
        editLinkUrl = linkElement.href;
        editLinkText = linkElement.textContent || '';
        
        if (editLinkTrigger) positionPopover(linkElement, editLinkTrigger);
        editLinkPopoverOpen = true;
    };

    const createLinkElement = (url: string, text: string) => {
        const linkElement = document.createElement('a');
        linkElement.href = url;
        linkElement.target = '_blank';
        linkElement.tabIndex = 0;
        linkElement.textContent = text;
        return linkElement;
    };

    // Event handlers
    onMount(() => {
        addEventListeners();
        return removeEventListeners;
    });

    function handleInput() {
        value = editorRef.innerHTML;
        makeLinksFocusable();
        setTimeout(updateActiveFormats, 0);
    }

    function updateActiveFormats() {
        if (!editorRef || document.activeElement !== editorRef) return;
        
        activeFormats = getActiveFormats();
        activeAlignment = getActiveAlignment();
    }

    function handlePaste(e: ClipboardEvent) {
        e.preventDefault();
        const text = e.clipboardData?.getData('text/plain') || '';
        document.execCommand('insertText', false, text);
    }

    function execCommand(command: string, value?: string) {
        if (isReadonly) return;
        
        editorRef.focus();
        document.execCommand(command, false, value);
        handleInput();
    }

    function handleFormatToggle(formats: string[]) {
        if (isReadonly) return;
        
        ensureEditorFocus();
        
        FORMATS.forEach(format => {
            const isCurrentlyActive = document.queryCommandState(format);
            const shouldBeActive = formats.includes(format);
            
            if (isCurrentlyActive !== shouldBeActive) {
                document.execCommand(format, false);
            }
        });
        
        handleInput();
    }

    function handleAlignmentChange(alignment: string) {
        if (isReadonly || !alignment || alignment === activeAlignment) return;
        
        ensureEditorFocus();
        const command = ALIGNMENTS[alignment as keyof typeof ALIGNMENTS];
        if (command) {
            document.execCommand(command, false);
            activeAlignment = alignment;
            handleInput();
        }
    }

    function handleLinkInteraction(e: MouseEvent | KeyboardEvent, isKeyboard = false) {
        if (isReadonly) return;
        
        const target = e.target as HTMLElement;
        const linkElement = target.closest('a') as HTMLAnchorElement;
        
        if (!linkElement || !editorRef.contains(linkElement)) return;
        
        if (isKeyboard && !['Enter', ' '].includes((e as KeyboardEvent).key)) return;
        
        e.preventDefault();
        e.stopPropagation();
        prepareEditLinkState(linkElement);
    }

    function handleLinkClick(e: MouseEvent) {
        handleLinkInteraction(e);
    }

    function handleLinkKeydown(e: KeyboardEvent) {
        handleLinkInteraction(e, true);
    }

    function handleLinkPopoverOpenChange(isOpen: boolean) {
        if (!isOpen) return;
        
        const selection = window.getSelection();
        
        if (selection && selection.rangeCount > 0) {
            savedSelection = selection.getRangeAt(0).cloneRange();
            linkText = selection.toString();
        } else {
            savedSelection = null;
            linkText = '';
        }
        linkUrl = '';
        linkPopoverOpen = isOpen;
    }

    function insertLink() {
        if (!linkUrl) {
            resetLinkPopoverState();
            return;
        }

        const displayText = linkText || linkUrl;

        if (savedSelection?.toString()) {
            const selection = window.getSelection();
            if (selection && savedSelection) {
                selection.removeAllRanges();
                selection.addRange(savedSelection);
                
                const linkElement = createLinkElement(linkUrl, linkText || savedSelection.toString());
                
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
            execCommand('insertHTML', `<a href="${linkUrl}" target="_blank" tabindex="0">${displayText}</a>`);
        }
        
        resetLinkPopoverState();
    }

    function updateExistingLink() {
        if (!editLinkUrl || !currentLinkElement) {
            resetEditLinkPopoverState();
            return;
        }
        
        currentLinkElement.href = editLinkUrl;
        currentLinkElement.textContent = editLinkText || editLinkUrl;
        handleInput();
        resetEditLinkPopoverState();
    }

    function visitLink() {
        if (editLinkUrl) window.open(editLinkUrl, '_blank');
        resetEditLinkPopoverState();
    }

    function removeLink() {
        if (currentLinkElement) {
            const textContent = currentLinkElement.textContent || '';
            currentLinkElement.outerHTML = textContent;
            handleInput();
        }
        resetEditLinkPopoverState();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (!(e.ctrlKey || e.metaKey)) return;
        
        const shortcut = KEYBOARD_SHORTCUTS[e.key as keyof typeof KEYBOARD_SHORTCUTS];
        if (!shortcut) return;
        
        e.preventDefault();
        
        if (shortcut === 'link') {
            linkPopoverOpen = true;
        } else {
            execCommand(shortcut);
        }
    }
</script>

<div>
    <RichEditorToolbar 
        {activeFormats}
        {activeAlignment}
        disabled={isReadonly}
        {linkPopoverOpen}
        bind:linkUrl
        bind:linkText
        onFormatToggle={handleFormatToggle}
        onAlignmentChange={handleAlignmentChange}
        onLinkPopoverOpenChange={handleLinkPopoverOpenChange}
        onInsertLink={insertLink}
        onCloseLinkPopover={resetLinkPopoverState}
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
        onClose={resetEditLinkPopoverState}
    />

    {#if field.helperText || showCharCount}
        <div class="flex justify-between items-center text-sm text-muted-foreground -mt-4">
            {#if field.helperText}
                <p id="{fieldId}-help">{field.helperText}</p>
            {:else}
                <div></div>
            {/if}
            {#if showCharCount}
                <p
                    id="{fieldId}-characters-left"
                    class="text-xs"
                    role="status"
                    aria-live="polite"
                >
                    <span class="tabular-nums">{currentLength}/{maxLength}</span>
                </p>
            {/if}
        </div>
    {/if}
</div>

 