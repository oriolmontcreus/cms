<script lang="ts">
    import type { FormField } from "../types";
    import { onMount, tick } from "svelte";
    import RichEditorToolbar from "./rich-editor/RichEditorToolbar.svelte";
    import RichEditorContent from "./rich-editor/RichEditorContent.svelte";
    import EditLinkPopover from "./rich-editor/EditLinkPopover.svelte";
    import { useGlobalVariables } from "../composables/useGlobalVariables";
    import { useVariablePopover } from "../composables/useVariablePopover";
    import { useVariableTooltip } from "../composables/useVariableTooltip";
    import { useContentEditable } from "../composables/useContentEditable";
    import VariablePopover from "../components/VariablePopover.svelte";
    import VariableTooltip from "../components/VariableTooltip.svelte";

    // Constants
    const FORMATS = ["bold", "italic", "underline"] as const;
    const ALIGNMENTS = {
        left: "justifyLeft",
        center: "justifyCenter",
        right: "justifyRight",
    } as const;
    const KEYBOARD_SHORTCUTS = {
        b: "bold",
        i: "italic",
        u: "underline",
        k: "link",
    } as const;

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";

    // Editor state
    let editorRef: HTMLDivElement;
    let richEditorContent: RichEditorContent;
    let activeFormats: string[] = [];
    let activeAlignment = "";
    let isUpdating = false;

    // Link state
    let linkUrl = "";
    let linkText = "";
    let linkPopoverOpen = false;
    let savedSelection: Range | null = null;

    // Edit link state
    let editLinkTrigger: HTMLButtonElement;
    let editLinkPopoverOpen = false;
    let editLinkUrl = "";
    let editLinkText = "";
    let currentLinkElement: HTMLAnchorElement | null = null;

    // Global variables composables
    const globalVariables = useGlobalVariables();
    const { data: globalVariablesData, variableNames } = globalVariables;
    const tooltip = useVariableTooltip();
    const contentEditable = useContentEditable();

    const popover = useVariablePopover(
        () => $variableNames,
        (variableName: string) => {
            insertVariable(variableName);
        },
    );

    // Computed properties
    $: isReadonly = field.readonly || field.disabled;
    $: currentLength = value?.replace(/<[^>]*>/g, "").length || 0;
    $: maxLength = field.max;
    $: showCharCount = maxLength && maxLength > 0;
    $: if (richEditorContent) editorRef = richEditorContent.getEditorRef();

    // Utility functions
    const getEventListeners = () =>
        [
            ["input", handleInput],
            ["paste", handlePaste],
            ["mouseup", updateActiveFormats],
            ["keyup", updateActiveFormats],
            ["click", handleLinkClick],
            ["keydown", handleLinkKeydown],
        ] as const;

    const addEventListeners = () => {
        if (!editorRef) return;

        getEventListeners().forEach(([event, handler]) => {
            editorRef.addEventListener(event, handler as EventListener);
        });
        document.addEventListener("selectionchange", updateActiveFormats);
    };

    const removeEventListeners = () => {
        if (!editorRef) return;

        getEventListeners().forEach(([event, handler]) => {
            editorRef.removeEventListener(event, handler as EventListener);
        });
        document.removeEventListener("selectionchange", updateActiveFormats);
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
        const links = editorRef.querySelectorAll("a:not([tabindex])");
        links.forEach((link) => link.setAttribute("tabindex", "0"));
    };

    const getActiveFormats = () => {
        return FORMATS.filter((format) => document.queryCommandState(format));
    };

    const getActiveAlignment = () => {
        const alignmentEntry = Object.entries(ALIGNMENTS).find(([_, command]) =>
            document.queryCommandState(command),
        );
        return alignmentEntry?.[0] || "";
    };

    const positionPopover = (
        element: HTMLElement,
        trigger: HTMLButtonElement,
    ) => {
        const rect = element.getBoundingClientRect();
        trigger.style.position = "absolute";
        trigger.style.left = `${rect.left}px`;
        trigger.style.top = `${rect.bottom}px`;
    };

    const resetLinkPopoverState = () => {
        linkPopoverOpen = false;
        linkUrl = "";
        linkText = "";
        savedSelection = null;
    };

    const resetEditLinkPopoverState = () => {
        editLinkPopoverOpen = false;
        editLinkUrl = "";
        editLinkText = "";
        currentLinkElement = null;
    };

    const updateValueAndCursor = (newValue: string, newCursorPos: number) => {
        tick().then(() => {
            isUpdating = true;
            // For rich editor, we need to preserve formatting while adding variable highlighting
            let processedHtml = newValue;
            if (newValue.includes("{{") && newValue.includes("}}")) {
                processedHtml =
                    globalVariables.renderTextWithVariables(newValue);
            }

            if (editorRef.innerHTML !== processedHtml) {
                editorRef.innerHTML = processedHtml;
                contentEditable.setCursorPosition(editorRef, newCursorPos);
            }
            isUpdating = false;

            value = editorRef.innerHTML;
            makeLinksFocusable();
        });
    };

    const insertVariable = (variableName: string) => {
        const plainTextValue = editorRef.textContent || "";
        contentEditable.insertTextAtCursor(
            editorRef,
            plainTextValue,
            variableName,
            (newValue: string, newCursorPos: number) => {
                popover.closePopover();

                // Use setTimeout to ensure proper timing
                setTimeout(() => {
                    isUpdating = true;
                    const rendered =
                        globalVariables.renderTextWithVariables(newValue);
                    editorRef.innerHTML = rendered;

                    // Ensure editor focus before setting cursor position
                    editorRef.focus();

                    // Use tick to ensure DOM has updated
                    tick().then(() => {
                        contentEditable.setCursorPosition(
                            editorRef,
                            newCursorPos,
                        );

                        // Add extra delay to ensure input state is reset
                        setTimeout(() => {
                            isUpdating = false;
                            value = editorRef.innerHTML;
                            makeLinksFocusable();
                        }, 50);
                    });
                }, 0);
            },
        );
    };

    const handleBeforeInput = (e: InputEvent) => {
        if (isUpdating) return;

        const plainTextValue = editorRef.textContent || "";
        const currentCursorPosition =
            contentEditable.getCurrentCursorPosition(editorRef);

        // Check if we're inside a variable block
        const insideBlock = contentEditable.isInsideVariableBlock(
            plainTextValue,
            currentCursorPosition,
        );

        if (insideBlock.isInside) {
            e.preventDefault();
            // Move cursor to end of the variable block
            if (insideBlock.blockEnd !== undefined) {
                setTimeout(() => {
                    contentEditable.setCursorPosition(
                        editorRef,
                        insideBlock.blockEnd!,
                    );
                }, 0);
            }
            return;
        }

        // For delete operations, check if we're deleting a variable block
        if (
            e.inputType === "deleteContentBackward" ||
            e.inputType === "deleteContentForward"
        ) {
            const key =
                e.inputType === "deleteContentBackward"
                    ? "Backspace"
                    : "Delete";
            const deleteSuccess = contentEditable.handleVariableBlockDeletion(
                plainTextValue,
                key,
                currentCursorPosition,
                updateValueAndCursor,
            );
            if (deleteSuccess) {
                e.preventDefault();
                return;
            }
        }
    };

    const handleBlur = () => {
        tooltip.hideTooltip();
    };

    const prepareEditLinkState = (linkElement: HTMLAnchorElement) => {
        currentLinkElement = linkElement;
        editLinkUrl = linkElement.href;
        editLinkText = linkElement.textContent || "";

        if (editLinkTrigger) positionPopover(linkElement, editLinkTrigger);
        editLinkPopoverOpen = true;
    };

    const createLinkElement = (url: string, text: string) => {
        const linkElement = document.createElement("a");
        linkElement.href = url;
        linkElement.target = "_blank";
        linkElement.tabIndex = 0;
        linkElement.textContent = text;
        return linkElement;
    };

    // Event handlers
    onMount(() => {
        addEventListeners();

        // Apply initial variable highlighting if value contains variables
        if (
            value &&
            editorRef &&
            (value.includes("{{") || editorRef.textContent?.includes("{{"))
        ) {
            tick().then(() => {
                const textContent = editorRef.textContent || "";
                if (textContent.includes("{{") && textContent.includes("}}")) {
                    isUpdating = true;
                    const rendered =
                        globalVariables.renderTextWithVariables(textContent);
                    editorRef.innerHTML = rendered;
                    isUpdating = false;
                    makeLinksFocusable();
                }
            });
        }

        return removeEventListeners;
    });

    function handleInput() {
        if (isUpdating) {
            console.log("⚠️ handleInput skipped - isUpdating is true");
            return;
        }

        console.log("🔄 handleInput called");

        // Get both HTML and plain text content
        const htmlValue = editorRef.innerHTML;
        const plainTextValue = editorRef.textContent || "";
        const currentCursorPosition =
            contentEditable.getCurrentCursorPosition(editorRef);

        console.log("📝 Content analysis:", {
            htmlValue,
            plainTextValue,
            currentCursorPosition,
            hasVariables:
                plainTextValue.includes("{{") && plainTextValue.includes("}}"),
            hasHighlighting: htmlValue.includes("variable-highlight"),
        });

        // Update the value with HTML content (preserve formatting)
        value = htmlValue;

        makeLinksFocusable();

        // Check for variable popover trigger using plain text
        const textBeforeCursor = plainTextValue.substring(
            Math.max(0, currentCursorPosition - 50),
            currentCursorPosition,
        );
        const matchIndex = textBeforeCursor.lastIndexOf("{{");

        let shouldApplyVariableHighlighting = false;

        if (matchIndex !== -1) {
            const searchStart = matchIndex + 2;
            const potentialQuery = textBeforeCursor.substring(searchStart);

            if (!potentialQuery.includes("}}")) {
                popover.openPopover(potentialQuery);
            } else {
                popover.closePopover();
                // Only apply highlighting if we just typed "}}" (check if cursor is right after "}}")
                const justTypedClosing =
                    plainTextValue.substring(
                        currentCursorPosition - 2,
                        currentCursorPosition,
                    ) === "}}";
                if (justTypedClosing) {
                    shouldApplyVariableHighlighting = true;
                    console.log(
                        "🎯 Variable just completed - will apply highlighting",
                    );
                }
            }
        } else {
            popover.closePopover();
        }

        // Only apply variable highlighting in specific cases:
        // 1. When a variable was just completed (}} was just typed)
        // 2. When content contains variables but doesn't have highlighting yet
        const hasVariables =
            plainTextValue.includes("{{") && plainTextValue.includes("}}");
        const hasHighlighting = htmlValue.includes("variable-highlight");

        console.log("🔍 Variable highlighting decision:", {
            hasVariables,
            hasHighlighting,
            shouldApplyVariableHighlighting,
            willApplyHighlighting:
                hasVariables &&
                (shouldApplyVariableHighlighting || !hasHighlighting),
        });

        if (
            hasVariables &&
            (shouldApplyVariableHighlighting || !hasHighlighting)
        ) {
            console.log("🎨 Applying variable highlighting...");
            isUpdating = true;

            const rendered =
                globalVariables.renderTextWithVariables(plainTextValue);

            console.log("📝 Rendered content:", rendered);

            if (editorRef.innerHTML !== rendered) {
                console.log(
                    "📝 Updating editor content from:",
                    editorRef.innerHTML,
                );
                console.log("📝 Updating editor content to:", rendered);
                editorRef.innerHTML = rendered;
                contentEditable.setCursorPosition(
                    editorRef,
                    currentCursorPosition,
                );
                value = rendered; // Update the value after rendering
                console.log("📝 Editor content updated");
            } else {
                console.log("📝 Editor content unchanged - no update needed");
            }

            isUpdating = false;
        }

        setTimeout(updateActiveFormats, 0);
    }

    function updateActiveFormats() {
        if (!editorRef || document.activeElement !== editorRef) {
            console.log("⚠️ updateActiveFormats skipped:", {
                hasEditorRef: !!editorRef,
                isActiveElement: document.activeElement === editorRef,
                activeElement: document.activeElement?.tagName,
            });
            return;
        }

        const newActiveFormats = getActiveFormats();
        const newActiveAlignment = getActiveAlignment();

        console.log("🔄 updateActiveFormats:", {
            previousFormats: activeFormats,
            newFormats: newActiveFormats,
            previousAlignment: activeAlignment,
            newAlignment: newActiveAlignment,
        });

        activeFormats = newActiveFormats;
        activeAlignment = newActiveAlignment;
    }

    function handlePaste(e: ClipboardEvent) {
        e.preventDefault();
        const text = e.clipboardData?.getData("text/plain") || "";
        document.execCommand("insertText", false, text);
    }

    function execCommand(command: string, value?: string) {
        if (isReadonly) return;

        console.log("🎯 execCommand called:", { command, value, isReadonly });
        console.log("📝 Editor content before:", editorRef.innerHTML);
        console.log("🎯 Editor focused:", document.activeElement === editorRef);

        editorRef.focus();
        const success = document.execCommand(command, false, value);
        console.log("✅ execCommand success:", success);
        console.log(
            "📝 Editor content after execCommand:",
            editorRef.innerHTML,
        );

        handleInput();
        console.log(
            "📝 Editor content after handleInput:",
            editorRef.innerHTML,
        );
    }

    function handleFormatToggle(formats: string[]) {
        if (isReadonly) return;

        console.log("🎨 handleFormatToggle called:", { formats, isReadonly });
        console.log(
            "📝 Editor content before formatting:",
            editorRef.innerHTML,
        );

        ensureEditorFocus();

        FORMATS.forEach((format) => {
            const isCurrentlyActive = document.queryCommandState(format);
            const shouldBeActive = formats.includes(format);

            console.log(`🔍 Format "${format}":`, {
                isCurrentlyActive,
                shouldBeActive,
            });

            if (isCurrentlyActive !== shouldBeActive) {
                const success = document.execCommand(format, false);
                console.log(`✅ execCommand "${format}" success:`, success);
            }
        });

        console.log("📝 Editor content after formatting:", editorRef.innerHTML);
        handleInput();
        console.log(
            "📝 Editor content after handleInput:",
            editorRef.innerHTML,
        );
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

    function handleLinkInteraction(
        e: MouseEvent | KeyboardEvent,
        isKeyboard = false,
    ) {
        if (isReadonly) return;

        const target = e.target as HTMLElement;
        const linkElement = target.closest("a") as HTMLAnchorElement;

        if (!linkElement || !editorRef.contains(linkElement)) return;

        if (isKeyboard && !["Enter", " "].includes((e as KeyboardEvent).key))
            return;

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
            linkText = "";
        }
        linkUrl = "";
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

                const linkElement = createLinkElement(
                    linkUrl,
                    linkText || savedSelection.toString(),
                );

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
            execCommand(
                "insertHTML",
                `<a href="${linkUrl}" target="_blank" tabindex="0">${displayText}</a>`,
            );
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
        if (editLinkUrl) window.open(editLinkUrl, "_blank");
        resetEditLinkPopoverState();
    }

    function removeLink() {
        if (currentLinkElement) {
            const textContent = currentLinkElement.textContent || "";
            currentLinkElement.outerHTML = textContent;
            handleInput();
        }
        resetEditLinkPopoverState();
    }

    function handleKeydown(e: KeyboardEvent) {
        const plainTextValue = editorRef.textContent || "";

        // Handle cursor navigation to jump over variable blocks
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            const currentCursorPosition =
                contentEditable.getCurrentCursorPosition(editorRef);
            const navigationHandled = contentEditable.handleCursorNavigation(
                plainTextValue,
                currentCursorPosition,
                e.key,
                (newValue: string, newCursorPos: number) => {
                    contentEditable.setCursorPosition(editorRef, newCursorPos);
                },
            );

            if (navigationHandled) {
                e.preventDefault();
                return;
            }
        }

        // Let the popover handle its own keydown events first
        const popoverHandled = popover.handleKeydown(e);
        if (popoverHandled) {
            return;
        }

        // Handle keyboard shortcuts
        if (!(e.ctrlKey || e.metaKey)) return;

        const shortcut =
            KEYBOARD_SHORTCUTS[e.key as keyof typeof KEYBOARD_SHORTCUTS];
        if (!shortcut) return;

        e.preventDefault();

        if (shortcut === "link") {
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
        onBeforeInput={handleBeforeInput}
        onInput={handleInput}
        onPaste={handlePaste}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        onLinkClick={handleLinkClick}
        onLinkKeydown={handleLinkKeydown}
        onKeydown={handleKeydown}
        onMouseOver={tooltip.handleMouseOver}
        onMouseOut={tooltip.handleMouseOut}
        onBlur={handleBlur}
    />

    <VariablePopover
        popoverState={popover.state}
        globalVariablesData={$globalVariablesData}
        onVariableSelect={popover.selectVariable}
    />

    <VariableTooltip tooltipState={tooltip.state} />

    <EditLinkPopover
        open={editLinkPopoverOpen}
        bind:linkUrl={editLinkUrl}
        bind:linkText={editLinkText}
        bind:triggerElement={editLinkTrigger}
        onUpdateLink={updateExistingLink}
        onVisitLink={visitLink}
        onRemoveLink={removeLink}
        onClose={resetEditLinkPopoverState}
        onOpenChange={(isOpen) => {
            if (!isOpen) resetEditLinkPopoverState();
        }}
    />

    {#if field.helperText || showCharCount}
        <div
            class="flex justify-between items-center text-sm text-muted-foreground -mt-4"
        >
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
                    <span class="tabular-nums">{currentLength}/{maxLength}</span
                    >
                </p>
            {/if}
        </div>
    {/if}
</div>

<style>
    :global(.variable-highlight) {
        color: var(--primary);
        font-weight: 500;
        border-radius: 0.25rem;
        padding: 0.125rem 0.25rem;
        margin: 0 1px;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas,
            "Liberation Mono", Menlo, monospace;
        display: inline;
        white-space: nowrap;
        cursor: help;
        transition: background-color 0.15s ease;
        box-sizing: border-box;
    }

    :global(.variable-highlight:hover) {
        background-color: var(--accent);
    }
</style>
