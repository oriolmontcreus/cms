# RichEditor Component Architecture

The RichEditor has been refactored into smaller, more manageable components for better maintainability and reusability.

## Component Structure

### Main Component
- **`RichEditor.svelte`** - The main orchestrator component that manages state and coordinates between child components

### Sub-components

#### Toolbar Components
- **`RichEditorToolbar.svelte`** - Main toolbar container that organizes all toolbar elements
- **`FormatToggleGroup.svelte`** - Text formatting controls (bold, italic, underline)
- **`AlignmentToggleGroup.svelte`** - Text alignment controls (left, center, right)
- **`LinkPopover.svelte`** - Insert new link functionality with popover UI

#### Content & Interaction
- **`RichEditorContent.svelte`** - The main contenteditable area with event handling
- **`EditLinkPopover.svelte`** - Edit existing links with visit/remove options
- **`CharacterCounter.svelte`** - Character count display component

## Benefits of This Architecture

### 1. **Separation of Concerns**
Each component has a single, well-defined responsibility:
- Toolbar manages layout and organization
- Format controls handle text styling
- Link components manage hyperlink functionality
- Content component handles the editor area

### 2. **Reusability**
Individual components can be reused in other contexts:
- Format controls could be used in other rich text implementations
- Link popover could be used in different editors
- Character counter is a generic utility component

### 3. **Maintainability**
- Smaller files are easier to understand and modify
- Clear component boundaries make debugging simpler
- Each component can be tested independently

### 4. **Extensibility**
Adding new features is straightforward:
- New toolbar items can be added to `RichEditorToolbar`
- New formatting options can be added as separate components
- The main `RichEditor` component coordinates everything

## Component Communication

The main `RichEditor` component:
- Manages all state variables
- Handles complex logic (DOM manipulation, selection handling)
- Coordinates between child components via props and callbacks
- Maintains backward compatibility with the original API

Child components:
- Receive props for their specific functionality
- Emit events back to the parent via callback functions
- Use two-way binding for form inputs where appropriate

## Usage

The refactored component maintains the same external API:

```svelte
<RichEditor 
    {field}
    {fieldId}
    bind:value
/>
```

## File Organization

```
rich-editor/
├── README.md                    # This documentation
├── index.ts                     # Export all components
├── FormatToggleGroup.svelte     # Bold, italic, underline
├── AlignmentToggleGroup.svelte  # Text alignment
├── LinkPopover.svelte           # Insert link functionality  
├── EditLinkPopover.svelte       # Edit existing links
├── RichEditorToolbar.svelte     # Toolbar container
├── RichEditorContent.svelte     # Main editor area
└── CharacterCounter.svelte      # Character count display
```

This structure makes the codebase more maintainable while preserving all original functionality. 