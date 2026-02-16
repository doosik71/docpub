# `quill-katex` Usage Guide

This document provides a guide to integrating and using the `quill-katex` package with QuillJS to enable the insertion and rendering of mathematical formulas using KaTeX. This guide is based on the analysis of its `README.md` and common integration patterns.

## 1. Introduction

`quill-katex` is a QuillJS module that seamlessly integrates the powerful [KaTeX](https://katex.org/) library into the Quill editor. This allows users to write and render mathematical expressions (both inline and block-level) directly within their rich text content, enhancing documents with scientific and technical notation.

## 2. Features

- Full support for mathematical formulas using KaTeX.
- Supports both block (display mode) and inline formulas.
- Provides toolbar buttons for easy formula insertion.
- Fully typed with TypeScript.
- Compatible with various JavaScript frameworks (React, Vue, Angular) and plain JavaScript.
- Works with Next.js (including App Router) and supports Server-Side Rendering (SSR).

## 3. Installation

The package, along with its peer dependency `katex`, can be installed via npm:

```bash
npm install quill-katex katex --save
```

_(Note: As per `package.json` in the main project, `quill-katex` is already installed. Ensure `quill` and `katex` are also installed.)_

## 4. Basic Usage

To integrate `quill-katex` into your Quill editor, follow these steps:

### 4.1. Import Required Styles

Import the necessary CSS files for both Quill and KaTeX.

```javascript
import "quill/dist/quill.snow.css"; // Or your chosen Quill theme CSS
import "katex/dist/katex.min.css"; // Essential for KaTeX rendering
```

### 4.2. Register the KaTeX Module

Import the `registerKatex` function from `quill-katex` and call it, passing the `Quill` object. This step is crucial and must be done _before_ initializing your Quill editor instance.

```javascript
import Quill from "quill";
import { registerKatex } from "quill-katex";

registerKatex(Quill);
```

### 4.3. Initialize Quill Editor with KaTeX Module

When initializing your Quill editor, you need to configure the `modules` option to include the `katex` module and its toolbar buttons.

```javascript
const quill = new Quill("#editor", {
  modules: {
    toolbar: {
      container: [
        ["bold", "italic", "underline"],
        ["katex", "katex-inline"], // Add buttons for block and inline KaTeX formulas
        // ... other toolbar items
      ],
    },
    katex: {
      toolbar: true, // Enable the toolbar handlers for KaTeX buttons
      // Other options for the katex module can be added here
    },
  },
  theme: "snow", // or 'bubble'
  placeholder: "Write your content here...",
});
```

- `'katex'` in the toolbar container typically corresponds to a button for inserting block-level equations.
- `'katex-inline'` in the toolbar container typically corresponds to a button for inserting inline equations.

## 5. API Reference

### `registerKatex(Quill): void`

This function is the primary entry point for integrating `quill-katex`. It registers the necessary Blots and the module with the Quill editor.

- `Quill`: The Quill constructor/class.

### Exported Classes and Components

While `registerKatex` is the main utility for setup, the package also exports underlying classes:

- **`KatexBlot`**: The Quill Blot responsible for rendering block-level mathematical formulas.
- **`KatexInlineBlot`**: The Quill Blot responsible for rendering inline mathematical formulas.
- **`KatexModule`**: The core Quill module class that manages the functionalities and interactions within the editor for KaTeX.

### Formats

The `quill-katex` module introduces two custom formats that can be applied in Quill:

- **`katex`**: Used for block-level (display mode) mathematical expressions.
- **`katex-inline`**: Used for inline mathematical expressions.

## 6. Customization

Currently, the `README.md` primarily highlights the `toolbar: true` option for the `katex` module. More advanced customization options for KaTeX rendering (e.g., specific KaTeX rendering options) would typically be passed to the `katex` module configuration, though explicit examples are not provided in the `README.md`.

```typescript
const quill = new Quill("#editor", {
  modules: {
    katex: {
      toolbar: true, // Enables toolbar buttons
      // Possible future customization:
      // displayMode: true, // Example KaTeX option
      // throwOnError: false, // Example KaTeX option
    },
  },
});
```

## 7. Compatibility

- Quill.js: v1.3.0 or higher
- KaTeX: v0.13.0 or higher
- Modern browsers (Chrome, Firefox, Safari, Edge)
- TypeScript: v4.0 or higher

## 8. Examples

The package's repository typically includes examples for integration with plain HTML/CDN, React with Vite, and Next.js, which can serve as practical guides.

## 9. License

This project is licensed under the MIT License.
