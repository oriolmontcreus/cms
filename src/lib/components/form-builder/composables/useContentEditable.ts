import { tick } from "svelte";

export interface CursorPosition {
    node: Text;
    offset: number;
}

export function useContentEditable() {
    function setCursorPosition(element: HTMLElement, offset: number) {
        const range = document.createRange();
        const selection = window.getSelection();
        if (!selection) return;

        const textNode = getTextNodeAtOffset(element, offset);
        if (textNode) {
            range.setStart(textNode.node, textNode.offset);
            range.setEnd(textNode.node, textNode.offset);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    function getTextNodeAtOffset(element: HTMLElement, offset: number): CursorPosition | null {
        let currentOffset = 0;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

        let node: Text | null = null;
        while ((node = walker.nextNode() as Text)) {
            const length = node.textContent?.length || 0;
            if (currentOffset + length >= offset) {
                return { node, offset: offset - currentOffset };
            }
            currentOffset += length;
        }

        if (node) {
            return { node, offset: (node as Text).textContent?.length || 0 };
        }
        return null;
    }

    function getCurrentCursorPosition(element: HTMLElement): number {
        const selection = window.getSelection();
        if (!selection?.rangeCount || !element) return 0;

        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);

        return preCaretRange.toString().length;
    }

    function updateElementContent(
        element: HTMLElement,
        newValue: string,
        renderFunction: (text: string) => string,
        preserveCursor = true
    ) {
        if (!element) return;

        const cursorPos = preserveCursor ? getCurrentCursorPosition(element) : 0;
        element.innerHTML = renderFunction(newValue);

        if (preserveCursor) {
            tick().then(() => {
                setCursorPosition(element, cursorPos);
            });
        }
    }

    function isInsideVariableBlock(value: string, cursorPos: number): { isInside: boolean; blockStart?: number; blockEnd?: number } {
        const variableRegex = /\{\{[^}]+\}\}/g;
        let match;

        while ((match = variableRegex.exec(value)) !== null) {
            const start = match.index;
            const end = match.index + match[0].length;

            if (cursorPos > start && cursorPos < end) {
                return { isInside: true, blockStart: start, blockEnd: end };
            }
        }

        return { isInside: false };
    }

    function handleVariableBlockDeletion(
        value: string,
        key: string,
        cursorPos: number,
        onUpdate: (newValue: string, newCursorPos: number) => void
    ): boolean {
        const variableRegex = /\{\{[^}]+\}\}/g;
        const matches: Array<{ start: number; end: number; content: string }> = [];
        let match;

        while ((match = variableRegex.exec(value)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                content: match[0],
            });
        }

        if (key === "Backspace") {
            const variableAtCursor = matches.find((m) => m.end === cursorPos);
            if (variableAtCursor) {
                const newValue =
                    value.substring(0, variableAtCursor.start) +
                    value.substring(variableAtCursor.end);
                onUpdate(newValue, variableAtCursor.start);
                return true;
            }
        } else if (key === "Delete") {
            const variableAtCursor = matches.find((m) => m.start === cursorPos);
            if (variableAtCursor) {
                const newValue =
                    value.substring(0, variableAtCursor.start) +
                    value.substring(variableAtCursor.end);
                onUpdate(newValue, variableAtCursor.start);
                return true;
            }
        }

        return false;
    }

    function preventEditingInsideVariable(
        value: string,
        cursorPos: number,
        event: KeyboardEvent,
        onUpdate: (newValue: string, newCursorPos: number) => void
    ): boolean {
        const insideBlock = isInsideVariableBlock(value, cursorPos);

        if (insideBlock.isInside && insideBlock.blockStart !== undefined && insideBlock.blockEnd !== undefined) {
            // Prevent most character input inside variable blocks
            if (event.key.length === 1 ||
                event.key === 'Backspace' ||
                event.key === 'Delete' ||
                event.key === 'Enter' ||
                event.key === 'Space') {

                // Allow navigation keys
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
                    event.preventDefault();

                    // Move cursor to the end of the variable block for easier navigation
                    onUpdate(value, insideBlock.blockEnd);
                    return true;
                }
            }
        }

        return false;
    }

    function handleCursorNavigation(
        value: string,
        cursorPos: number,
        key: string,
        onUpdate: (newValue: string, newCursorPos: number) => void
    ): boolean {
        const variableRegex = /\{\{[^}]+\}\}/g;
        const matches: Array<{ start: number; end: number; content: string }> = [];
        let match;

        while ((match = variableRegex.exec(value)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                content: match[0],
            });
        }

        if (key === 'ArrowRight') {
            // Check if we're at the start of a variable block
            const variableAtCursor = matches.find((m) => m.start === cursorPos);
            if (variableAtCursor) {
                onUpdate(value, variableAtCursor.end);
                return true;
            }

            // Check if we're inside a variable block
            const insideBlock = matches.find((m) => cursorPos > m.start && cursorPos < m.end);
            if (insideBlock) {
                onUpdate(value, insideBlock.end);
                return true;
            }
        } else if (key === 'ArrowLeft') {
            // Check if we're at the end of a variable block
            const variableAtCursor = matches.find((m) => m.end === cursorPos);
            if (variableAtCursor) {
                onUpdate(value, variableAtCursor.start);
                return true;
            }

            // Check if we're inside a variable block
            const insideBlock = matches.find((m) => cursorPos > m.start && cursorPos < m.end);
            if (insideBlock) {
                onUpdate(value, insideBlock.start);
                return true;
            }
        }

        return false;
    }

    function insertTextAtCursor(
        element: HTMLElement,
        value: string,
        textToInsert: string,
        onUpdate: (newValue: string, newCursorPos: number) => void
    ) {
        const cursorPos = getCurrentCursorPosition(element);
        const textBeforeCursor = value.substring(0, cursorPos);
        const textAfterCursor = value.substring(cursorPos);

        const matchIndex = textBeforeCursor.lastIndexOf("{{");
        if (matchIndex === -1) return;

        const beforePattern = textBeforeCursor.substring(0, matchIndex);
        const replacement = `{{${textToInsert}}}`;

        const newValue = beforePattern + replacement + textAfterCursor;
        const newCursorPos = beforePattern.length + replacement.length;

        onUpdate(newValue, newCursorPos);
    }

    return {
        setCursorPosition,
        getCurrentCursorPosition,
        updateElementContent,
        handleVariableBlockDeletion,
        insertTextAtCursor,
        preventEditingInsideVariable,
        isInsideVariableBlock,
        handleCursorNavigation
    };
}
