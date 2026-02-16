# `quill-delta-to-html` Usage Guide

This document provides a comprehensive guide on how to use the `quill-delta-to-html` package, which converts Quill's Delta format into HTML. This guide is based on the analysis of the provided source code and `README.md`.

## 1. Introduction

`quill-delta-to-html` is a utility library that takes Quill's rich text content, represented in its Delta format (a JSON-based array of operations), and converts it into a corresponding HTML string. This is particularly useful for rendering Quill-generated content outside of the editor environment, such as on a webpage or in an email.

## 2. Installation

The package can be installed via npm:

```bash
npm install quill-delta-to-html
```

_(Note: As per `package.json` in the main project, this package is already installed.)_

## 3. Basic Usage

To convert Quill Delta operations to HTML, you need to import the `QuillDeltaToHtmlConverter` class, instantiate it with your Delta operations and optional configurations, and then call the `convert()` method.

### 3.1. Importing the Converter

For CommonJS (Node.js):

```javascript
var QuillDeltaToHtmlConverter =
  require("quill-delta-to-html").QuillDeltaToHtmlConverter;
```

For ES6 Modules (TypeScript/JavaScript):

```javascript
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
```

### 3.2. Performing the Conversion

```javascript
// Example Delta operations (obtained from Quill editor's getContents() method)
var deltaOps =  [
    {insert: "Hello
"},
    {insert: "This is colorful", attributes: {color: '#f00'}}
    // ... more delta operations
];

// Optional configuration object
var cfg = {
    // See Configuration section for available options
    inlineStyles: true // Example: Render with inline styles
};

// Instantiate the converter
var converter = new QuillDeltaToHtmlConverter(deltaOps, cfg);

// Perform the conversion
var html = converter.convert();

console.log(html);
/*
<p>Hello</p>
<p><span style="color:#f00;">This is colorful</span></p>
*/
```

## 4. Configuration Options

The `QuillDeltaToHtmlConverter` constructor accepts a second argument, a configuration object, to customize the HTML output.

| Option                   | Type                                                                   | Default          | Description                                                                                                                                              |
| :----------------------- | :--------------------------------------------------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `paragraphTag`           | `string`                                                               | `'p'`            | Custom HTML tag to wrap inline content.                                                                                                                  |
| `encodeHtml`             | `boolean`                                                              | `true`           | If `true`, characters like `<`, `>`, `/`, `'`, `"`, `&` in the content will be HTML-encoded.                                                             |
| `classPrefix`            | `string`                                                               | `'ql'`           | A CSS class name prefix for classes generated from Quill styles (e.g., `ql-size-large`, `ql-font-serif`).                                                |
| `inlineStyles`           | `boolean` or `object`                                                  | `false`          | If `true`, uses inline styles instead of classes. Can be an object for granular control over inline styles (see "Rendering Inline Styles" section).      |
| `multiLineBlockquote`    | `boolean`                                                              | `true`           | If `true`, consecutive blockquotes with the same styles are rendered into a single `<blockquote>` element.                                               |
| `multiLineHeader`        | `boolean`                                                              | `true`           | Similar to `multiLineBlockquote`, for header elements.                                                                                                   |
| `multiLineCodeblock`     | `boolean`                                                              | `true`           | Similar to `multiLineBlockquote`, for code blocks.                                                                                                       |
| `multiLineParagraph`     | `boolean`                                                              | `true`           | If `false`, a new `<p>` tag is generated after each newline character (enter press).                                                                     |
| `linkRel`                | `string`                                                               | `none generated` | Specifies a `rel` attribute value for all generated links. Can be overridden by individual Delta operations.                                             |
| `linkTarget`             | `string`                                                               | `'_blank'`       | Specifies a `target` attribute value for all generated links. Use `''` to omit the `target` attribute. Can be overridden by individual Delta operations. |
| `allowBackgroundClasses` | `boolean`                                                              | `false`          | If `true`, CSS classes will be added for background attributes.                                                                                          |
| `urlSanitizer`           | `function (url: string): string \| undefined`                          | `undefined`      | A callback function for custom URL sanitization. If it returns a string, that string is used; otherwise, the library's default sanitization is applied.  |
| `customTag`              | `function (format: string, op: DeltaInsertOp): string \| undefined`    | `undefined`      | A callback to provide a custom HTML tag for a specific format.                                                                                           |
| `customTagAttributes`    | `function (op: DeltaInsertOp): { [key: string]: string } \| undefined` | `undefined`      | A callback to provide custom HTML tag attributes for an operation.                                                                                       |
| `customCssClasses`       | `function (op: DeltaInsertOp): string \| string[] \| undefined`        | `undefined`      | A callback to provide custom CSS classes for an operation.                                                                                               |
| `customCssStyles`        | `function (op: DeltaInsertOp): string \| string[] \| undefined`        | `undefined`      | A callback to provide custom CSS styles for an operation.                                                                                                |

## 5. Advanced Custom Rendering

The converter provides hooks to customize the rendering process at various stages.

### 5.1. Render Events (`beforeRender`, `afterRender`)

You can register callbacks that are triggered before and after rendering different groups of operations. A "group" can be continuous inline elements, a video element, list elements, or block elements (header, code-block, blockquote, align, indent, direction).

```javascript
converter.beforeRender(function (groupType, data) {
  // `groupType`: 'video', 'block', 'list', 'inline-group'
  // `data`: raw operation objects for the group
  // Return your custom HTML; if falsy, the system's default will be used.
});

converter.afterRender(function (groupType, htmlString) {
  // `groupType`: 'video', 'block', 'list', 'inline-group'
  // `htmlString`: the HTML generated for the group
  // Modify and return the HTML string.
});

var html = converter.convert();
```

### 5.2. Rendering Inline Styles with `inlineStyles` Object

When `inlineStyles` is an object, you can define custom style mappings for Quill attributes. Keys of the object are Quill attribute names (e.g., `font`, `size`, `indent`, `direction`). Values can be:

- A lookup table: `{'value': 'css-style-string'}`
- A function: `(value, op) => 'css-style-string'`

```javascript
var cfg = {
  inlineStyles: {
    font: {
      serif: "font-family: Georgia, Times New Roman, serif",
      monospace: "font-family: Monaco, Courier New, monospace",
    },
    size: {
      small: "font-size: 0.75em",
      large: "font-size: 1.5em",
      huge: "font-size: 2.5em",
    },
    indent: (value, op) => {
      var indentSize = parseInt(value, 10) * 3;
      var side = op.attributes["direction"] === "rtl" ? "right" : "left";
      return "padding-" + side + ":" + indentSize + "em";
    },
    direction: (value, op) => {
      if (value === "rtl") {
        return (
          "direction:rtl" +
          (op.attributes["align"] ? "" : "; text-align: inherit")
        );
      } else {
        return "";
      }
    },
  },
};
```

### 5.3. Rendering Custom Blot Formats (`renderCustomWith`)

If you have custom Quill Blots, you can provide a rendering function for them using `renderCustomWith`.

```javascript
// Example Delta operations with a custom blot
let ops = [
  {
    insert: { "my-blot": { id: 2, text: "xyz" } },
    attributes: { renderAsBlock: true },
  },
];

let converter = new QuillDeltaToHtmlConverter(ops);

converter.renderCustomWith(function (customOp, contextOp) {
  // `customOp`: The custom blot's Delta operation
  // `contextOp`: The block operation wrapping this blot (e.g., a list item), if any.
  if (customOp.insert.type === "my-blot") {
    let val = customOp.insert.value;
    return `<span id="${val.id}">${val.text}</span>`;
  } else {
    return "<!-- Unmanaged custom blot! -->"; // Or throw an error
  }
});

var html = converter.convert();
```

To render a custom blot as a block element, ensure its attributes include `renderAsBlock: true`.

### 5.4. Advanced Custom Rendering Using Grouped Ops (`getGroupedOps`)

For ultimate control, you can retrieve the converter's internally processed and grouped operations using `getGroupedOps()` and render the HTML entirely manually. This is useful for highly specialized rendering requirements.

```javascript
let converter = new QuillDeltaToHtmlConverter(deltaOps, cfg);
let groupedOps = converter.getGroupedOps();

// You can then iterate through `groupedOps` and generate HTML based on the structure.
// `groupedOps` contains instances of `InlineGroup`, `VideoItem`, `BlockGroup`, `ListGroup`, and `BlotBlock`.
```

## 6. Live Demo

A live demo of the conversion can be found by opening the `demo-browser.html` file in the package's root directory after cloning the repository.
