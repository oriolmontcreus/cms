<script lang="ts">
    import type { FormField } from '../../types';
    import { onMount } from 'svelte';

    export let field: FormField;
    export let fieldId: string;
    export let value: string = '';
    export let showCharCount: boolean;
    export let onInput: () => void;
    export let onPaste: (e: ClipboardEvent) => void;
    export let onMouseUp: () => void;
    export let onKeyUp: () => void;
    export let onLinkClick: (e: MouseEvent) => void;
    export let onLinkKeydown: (e: KeyboardEvent) => void;
    export let onKeydown: (e: KeyboardEvent) => void;

    let editorRef: HTMLDivElement;

    onMount(() => {
        if (editorRef) {
            editorRef.innerHTML = value || '';
            
            // Make existing links focusable
            const links = editorRef.querySelectorAll('a');
            links.forEach(link => {
                if (!link.hasAttribute('tabindex')) {
                    link.setAttribute('tabindex', '0');
                }
            });
        }
    });

    // Export the editor reference for parent component
    export function getEditorRef() {
        return editorRef;
    }
</script>

<div
    bind:this={editorRef}
    contenteditable={!field.readonly && !field.disabled}
    class="min-h-32 p-3 border border-t-0 rounded-b-md bg-background ring-offset-background outline-none transition-all duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive rich-editor [&_a]:underline [&_a]:decoration-gray-400 [&_a]:underline-offset-2 [&_a]:text-blue-600 [&_a]:hover:text-blue-700 [&_a]:hover:decoration-blue-600 [&_a]:transition-colors [&_a]:cursor-pointer [&_a]:rounded-sm [&_a]:px-1 [&_a]:py-0.5 [&_a]:mx-0.5 [&_a]:bg-blue-50 [&_a]:hover:bg-blue-100 [&_a]:border [&_a]:border-transparent [&_a]:hover:border-blue-200 [&_a]:focus:outline-none [&_a]:focus:ring-2 [&_a]:focus:ring-ring [&_a]:focus:ring-offset-1 [&_a]:tabindex-0 dark:[&_a]:text-blue-400 dark:[&_a]:hover:text-blue-300 dark:[&_a]:decoration-gray-500 dark:[&_a]:hover:decoration-blue-400 dark:[&_a]:bg-blue-950/30 dark:[&_a]:hover:bg-blue-900/40 dark:[&_a]:hover:border-blue-700"
    class:opacity-50={field.disabled}
    class:cursor-not-allowed={field.disabled}
    style="min-height: {field.rows ? field.rows * 1.5 : 8}rem;"
    placeholder={field.placeholder}
    aria-describedby={showCharCount ? `${fieldId}-characters-left` : undefined}
    on:input={onInput}
    on:paste={onPaste}
    on:mouseup={onMouseUp}
    on:keyup={onKeyUp}
    on:click={onLinkClick}
    on:keydown={(e) => {
        onLinkKeydown(e);
        onKeydown(e);
    }}
    role="textbox"
    aria-multiline="true"
    aria-label={field.label}
    tabindex="0"
></div> 