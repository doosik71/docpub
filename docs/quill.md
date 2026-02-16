# Quill Rich Text Editor Usage Guide

This document provides a guide to using Quill, a modern rich text editor. It covers installation, basic usage, core concepts, and configuration, based on the provided `README.md` and general knowledge of the Quill API. For the most comprehensive and up-to-date documentation, always refer to the [official Quill website](https://quilljs.com/).

## 1. Introduction

QuillJS is a powerful, open-source rich text editor built for compatibility and extensibility. It's known for its clean API, modular architecture, and the ability to output content in its own JSON-based format called "Delta".

## 2. Installation

Quill can be installed via npm or included directly from a CDN.

### 2.1. npm Installation

```bash
npm install quill
```

_(Note: As per `package.json` in the main project, Quill is already installed.)_

### 2.2. CDN Usage (for quick prototyping or basic inclusion)

Include the Quill library and its stylesheet in your HTML:

```html
<!-- Include Quill stylesheet (Snow or Bubble theme, or core) -->
<link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet" />
<!-- Or for Bubble theme: -->
<!-- <link href="https://cdn.quilljs.com/1.3.7/quill.bubble.css" rel="stylesheet"> -->
<!-- Or core build with no theme: -->
<!-- <link href="https://cdn.quilljs.com/1.3.7/quill.core.css" rel="stylesheet"> -->

<!-- Include the Quill library -->
<script src="https://cdn.quilljs.com/1.3.7/quill.js"></script>
<!-- Or minified version: -->
<!-- <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script> -->
```

## 3. Basic Usage (Quickstart)

To initialize a Quill editor, you need an HTML container element and an optional toolbar container.

```html
<!-- Create the toolbar container (optional, but highly recommended) -->
<div id="toolbar">
  <!-- Basic buttons for bold, italic -->
  <button class="ql-bold"></button>
  <button class="ql-italic"></button>
  <!-- More complex controls can be added here -->
  <select class="ql-header">
    <option value="1"></option>
    <option value="2"></option>
    <option value=""></option>
  </select>
</div>

<!-- Create the editor container -->
<div id="editor">
  <p>Hello World!</p>
  <p>Some <span style="font-weight: bold;">bold</span> text.</p>
</div>

<script>
  // Initialize Quill editor
  var quill = new Quill("#editor", {
    modules: {
      toolbar: "#toolbar", // Link to the toolbar container
    },
    theme: "snow", // 'snow', 'bubble', or 'core' (no theme)
  });
</script>
```

In your JavaScript, import Quill and instantiate it:

```javascript
import Quill from "quill";

// ... (HTML setup as above)

const quill = new Quill("#editor", {
  modules: {
    toolbar: "#toolbar", // Reference to your toolbar element or a configuration array
  },
  theme: "snow", // or 'bubble' for a floating toolbar, or null for no theme
  placeholder: "Start writing your document...", // Optional placeholder text
  readOnly: false, // Optional: set to true to make editor read-only
});
```

## 4. Core Concepts

### 4.1. Delta Format

Quill uses its own JSON-based format called **Delta** to represent content and changes. Deltas are a concise, expressive, and human-readable way to describe rich text. They consist of an array of operations, typically `insert`, `delete`, and `retain`.

Example Delta:

```json
[
  { "insert": "Hello" },
  { "insert": "World!", "attributes": { "bold": true } },
  { "insert": "
" }
]
```

You can get the current content of the editor as a Delta using `quill.getContents()` and set content using `quill.setContents(delta)`.

### 4.2. Blots

Quill extends the DOM by mapping semantic meaning to raw DOM nodes using **Blots**. Blots are the fundamental building blocks of Quill's content. They allow for a structured and extensible way to represent rich text, embeds, and custom content. You can create custom Blots to extend Quill's capabilities.

### 4.3. Modules

Quill's functionality is highly modular. **Modules** are pluggable extensions that add features like toolbars, history, keyboard bindings, and custom formats. Many features, including the toolbar, are implemented as modules.

Commonly used modules:

- **Toolbar Module**: Manages the editor's toolbar.
- **History Module**: Provides undo/redo functionality.
- **Keyboard Module**: Handles keyboard shortcuts.
- **Syntax Module**: For syntax highlighting in code blocks.

### 4.4. Themes

Quill comes with two official themes: **Snow** (a clean, flat theme with a fixed toolbar) and **Bubble** (a minimalist, floating toolbar theme). You can also opt for no theme (`null`) and apply your own custom styling.

## 5. Quill API Highlights

The Quill instance provides a rich API for programmatic control over the editor.

### 5.1. Content Manipulation

- `quill.getContents()`: Returns a Delta object representing the editor's content.
- `quill.setContents(delta, source)`: Replaces the editor's content with a new Delta. `source` can be `'api'`, `'user'`, or `'silent'`.
- `quill.setText(text, source)`: Sets the editor's text content.
- `quill.insertText(index, text, format, value, source)`: Inserts text at a specific index.
- `quill.deleteText(index, length, source)`: Deletes text.
- `quill.updateContents(delta, source)`: Applies a Delta to the current content, useful for incremental updates.

### 5.2. Selection and Focus

- `quill.getSelection(focus)`: Returns the current selection range.
- `quill.setSelection(index, length, source)`: Sets the selection.
- `quill.focus()`: Focuses the editor.
- `quill.blur()`: Blurs the editor.

### 5.3. Formatting

- `quill.format(format, value, source)`: Applies a format to the current selection or a given range.
- `quill.removeFormat(index, length, source)`: Removes all formats from a given range.
- `quill.getFormat(range)`: Returns the formats active in the current selection or range.

### 5.4. Events

Quill emits various events that you can listen to:

- `text-change`: Fired when the editor's content changes.
- `selection-change`: Fired when the user's selection changes.
- `editor-change`: Fired for both `text-change` and `selection-change`, providing a unified event for editor state changes.

```javascript
quill.on("text-change", function (delta, oldDelta, source) {
  console.log("Text change!", delta, oldDelta, source);
});

quill.on("selection-change", function (range, oldRange, source) {
  if (range) {
    console.log("User selection changed to", range);
  } else {
    console.log("Selection lost");
  }
});
```

## 6. Configuration Options

When instantiating Quill, you can pass a configuration object to customize its behavior.

```javascript
var quill = new Quill("#editor", {
  bounds: "#editor-container", // Restrict editor interaction to a specific element
  debug: "warn", // 'error', 'warn', 'log', or false
  formats: ["bold", "italic", "underline", "link", "image"], // Whitelist formats
  modules: {
    // Customize or add modules
    toolbar: {
      container: [
        ["bold", "italic", "underline", "strike"], // toggled buttons
        ["blockquote", "code-block"],

        [{ header: 1 }, { header: 2 }], // custom button values
        [{ list: "ordered" }, { list: "bullet" }],
        [{ script: "sub" }, { script: "super" }], // superscript/subscript
        [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
        [{ direction: "rtl" }], // text direction

        [{ size: ["small", false, "large", "huge"] }], // custom dropdown
        [{ header: [1, 2, 3, 4, 5, 6, false] }],

        [{ color: [] }, { background: [] }], // dropdown with defaults from theme
        [{ font: [] }],
        [{ align: [] }],

        ["clean"], // remove formatting button
      ],
      handlers: {
        /* custom handlers for toolbar buttons */
      },
    },
    history: {
      delay: 2000,
      maxStack: 500,
      userOnly: true,
    },
    imageResize: {
      /* configuration for an external image resize module */
    },
    // ... other module configurations
  },
  placeholder: "Compose an epic...",
  readOnly: false,
  scrollingContainer: null, // Specify a custom scroll container
  theme: "snow",
});
```

Key configuration options:

- `bounds`: Element or selector specifying the editor's bounds for interactions.
- `debug`: Enable debug output (`'warn'`, `'error'`, `'log'`, `false`).
- `formats`: An array of formats to whitelist. Only whitelisted formats can be applied.
- `modules`: An object to configure existing modules or register new ones.
  - `toolbar`: Can be a DOM element, selector, or an array of toolbar items. Also supports custom `handlers`.
- `placeholder`: Text to display when the editor is empty.
- `readOnly`: Set to `true` to disable editing.
- `scrollingContainer`: Element or selector defining the scrollable container for the editor.
- `theme`: Which theme to use (`'snow'`, `'bubble'`, or `null`).

For more detailed information on customization, modules, and API, refer to the [Quill Documentation](https://quilljs.com/docs/).
