# Global Variables Composables and Components

This folder contains reusable composables and components for implementing global variable functionality in form fields and other input components.

## Structure

### Composables (`composables/`)
- **`useGlobalVariables.ts`** - Manages global variables data and rendering
- **`useVariablePopover.ts`** - Handles the variable selection popover logic
- **`useVariableTooltip.ts`** - Manages variable value tooltips
- **`useContentEditable.ts`** - Provides utilities for contenteditable elements

### Components (`components/`)
- **`VariablePopover.svelte`** - Reusable popover component for variable selection
- **`VariableTooltip.svelte`** - Reusable tooltip component for variable values

## Usage

### Basic Text Input with Variables

```svelte
<script lang="ts">
    import { useGlobalVariables } from "../composables/useGlobalVariables";
    import { useVariablePopover } from "../composables/useVariablePopover";
    import { useVariableTooltip } from "../composables/useVariableTooltip";
    import { useContentEditable } from "../composables/useContentEditable";
    import VariablePopover from "../components/VariablePopover.svelte";
    import VariableTooltip from "../components/VariableTooltip.svelte";
    
    let value = "";
    let element: HTMLDivElement;

    const globalVariables = useGlobalVariables();
    const tooltip = useVariableTooltip();
    const contentEditable = useContentEditable();
    
    const popover = useVariablePopover(
        globalVariables.variableNames,
        (variableName) => {
            // Handle variable insertion
            contentEditable.insertTextAtCursor(
                element,
                value,
                variableName,
                (newValue, newCursorPos) => {
                    value = newValue;
                    // Update UI and cursor position
                }
            );
        }
    );
</script>

<div contenteditable bind:this={element}>
    {@html globalVariables.renderTextWithVariables(value)}
</div>

<VariablePopover 
    popoverState={popover.state} 
    globalVariablesData={globalVariables.data}
    onVariableSelect={popover.selectVariable}
/>

<VariableTooltip tooltipState={tooltip.state} />
```

### Features

1. **Variable Detection**: Automatically detects `{{variableName}}` patterns
2. **Autocomplete**: Shows filtered variable suggestions as you type
3. **Keyboard Navigation**: Arrow keys, Enter/Tab to select, Escape to close
4. **Value Tooltips**: Hover over variables to see their current values
5. **Block Deletion**: Delete entire variable blocks with backspace/delete
6. **Cursor Management**: Maintains proper cursor position during updates

### Styling

The components include default styling with CSS custom properties:
- `--primary` - Variable highlight color
- `--accent` - Variable hover background
- `--muted-foreground` - Placeholder text color
- `--popover`, `--border` - Popover styling

### Examples

See `TextInput.svelte` and `TextAreaWithVariables.svelte` for complete implementation examples.

## API Reference

### useGlobalVariables()
- `state` - Reactive store with variable data
- `variableNames` - Array of available variable names  
- `data` - Object with variable name/value pairs
- `renderTextWithVariables(text)` - Renders text with variable highlighting

### useVariablePopover(variables, onSelect)
- `state` - Reactive store with popover state
- `openPopover(query?)` - Opens popover with optional search
- `closePopover()` - Closes the popover
- `handleKeydown(event)` - Handles keyboard navigation
- `selectVariable(name)` - Selects a specific variable

### useVariableTooltip()
- `state` - Reactive store with tooltip state
- `handleMouseOver(event)` - Shows tooltip on variable hover
- `handleMouseOut(event)` - Hides tooltip
- `showTooltip(content, x, y)` - Manually show tooltip
- `hideTooltip()` - Manually hide tooltip

### useContentEditable()
- `setCursorPosition(element, offset)` - Sets cursor to specific position
- `getCurrentCursorPosition(element)` - Gets current cursor position
- `updateElementContent(element, value, renderer, preserveCursor?)` - Updates content
- `handleVariableBlockDeletion(value, key, cursorPos, onUpdate)` - Handles block deletion
- `insertTextAtCursor(element, value, text, onUpdate)` - Inserts text at cursor
