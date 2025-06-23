# RichEditor Field Usage Example

Here's how to use the new RichEditor field in your form builder:

```typescript
import { RichEditor, buildFields } from './fields';

// Create a rich text editor field
const fields = buildFields(
    RichEditor('content')
        .label('Article Content')
        .placeholder('Start writing your article...')
        .required()
        .rows(10)
        .helperText('Use the toolbar to format your text with bold, italic, underline, alignment, and links.')
        .max(5000) // Character limit (excluding HTML tags)
);
```

## Features

The RichEditor provides:

- **Bold, Italic, Underline**: Basic text formatting
- **Text Alignment**: Left, center, right alignment
- **Link Insertion**: Add hyperlinks with custom text
- **Keyboard Shortcuts**: 
  - Ctrl+B (Bold)
  - Ctrl+I (Italic) 
  - Ctrl+U (Underline)
  - Ctrl+K (Insert Link)
- **HTML Output**: Content is saved as HTML
- **Character Counting**: Counts visible text (excluding HTML tags)
- **Accessibility**: Full keyboard navigation and screen reader support

## HTML Output

The RichEditor saves content as HTML, so you'll get output like:

```html
<p>This is <strong>bold text</strong> and <em>italic text</em>.</p>
<p style="text-align: center;">This is centered text.</p>
<p>Check out <a href="https://example.com" target="_blank">this link</a>!</p>
``` 