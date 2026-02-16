# `quill1.3.7-table-module` Usage Guide

This document provides a guide on how to integrate and use the `quill1.3.7-table-module` package with QuillJS@1.3.7, based on the provided source code and `README.md` analysis.

## 1. Introduction

The `quill1.3.7-table-module` is a QuillJS module designed to provide table editing functionalities within the rich text editor. It enables users to insert, modify, and style tables directly within their Quill editor instances.

## 2. Installation

The package can be installed via npm:

```bash
npm install quill1.3.7-table-module
```

_(Note: As per `package.json` in the main project, this package is already installed.)_

## 3. Integration with QuillJS

To integrate the table module into your Quill editor, follow these steps:

### 3.1. Import necessary components and CSS

First, import the `Quill` object, `TableHandler`, `rewirteFormats` function, and the module's CSS file into your editor component (e.g., `src/components/editor/index.jsx`).

```javascript
import Quill from "quill";
import TableHandler, { rewirteFormats } from "quill1.3.7-table-module";
import "quill1.3.7-table-module/dist/index.css";
```

### 3.2. Register the module and rewrite formats

Before initializing your Quill instance, register the `TableHandler` module with Quill and call `rewirteFormats()`. The `rewirteFormats()` function is crucial for ensuring native Quill formats (like list items) display correctly within table cells.

```javascript
Quill.register({ [`modules/${TableHandler.moduleName}`]: TableHandler }, true);
rewirteFormats(); // Call this to handle exceptions for native formats within tables
```

### 3.3. Configure Quill editor modules

When initializing your Quill instance, you need to configure the `modules` option to include the table module and potentially its toolbar integration.

```javascript
const quill = new Quill("#editor", {
  theme: "snow", // or 'bubble'
  modules: {
    toolbar: {
      container: [
        // ... other toolbar buttons
        // To add a table button to a custom toolbar container (e.g., #quill-toolbar)
        // you would typically include a button with the class 'ql-table'.
        // Example: <button class="ql-table"></button> in your HTML toolbar.
        TableHandler.toolName, // Alternatively, if not using a custom container, you can directly add this to the array.
      ],
      // If you have custom handlers, ensure they don't conflict.
      // For instance, if you have a custom toolbar configuration like:
      // container: "#quill-toolbar"
      // Then ensure your HTML for #quill-toolbar includes <button class="ql-table"></button>
    },
    // Configure the table module itself
    [`${TableHandler.moduleName}`]: {
      fullWidth: true, // Example: Table always takes 100% width
      customButton: "Insert Table", // Example: Label for a custom table button (internal to table UI)
      // ... other options
    },
    // ... other Quill modules (e.g., 'history', 'formula')
  },
  placeholder: "Start writing...",
});
```

**Explanation of Toolbar Integration:**

If you are using a custom toolbar container (e.g., specified by `toolbar: { container: "#quill-toolbar" }`), you need to manually add an HTML button with the class `ql-table` to your toolbar structure. The `quill1.3.7-table-module` module listens for clicks on elements with this class to trigger table insertion.

Example HTML for a custom toolbar button:

```html
<div id="quill-toolbar">
  <!-- Other buttons -->
  <button class="ql-table"></button>
</div>
```

## 4. Configuration Options

The `quill1.3.7-table-module` offers several configuration options that can be passed within the `modules` object during Quill initialization:

| Option          | Type                        | Default          | Description                                                                                                                                                                                                                 |
| :-------------- | :-------------------------- | :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fullWidth`     | `boolean`                   | `false`          | If `true`, the table will always occupy 100% of the editor's width.                                                                                                                                                         |
| `customSelect`  | `() => HTMLElement`         |                  | Provides a custom element for table size selection. The returned element must dispatch a custom event (`TableModule.createEventName`) with `{ row: number, col: number }` in its `detail` property when a table is created. |
| `tableToolTip`  | `ToolTip` object            |                  | Configuration for the table tooltip, including `tipHeight` and `disableToolNames` (array of tool names to disable within the table).                                                                                        |
| `operationMenu` | `OperationMenu` object      | Default items    | Configuration for the table context menu (right-click menu). Allows customizing `items`, `replaceItems`, and `modifyItems`. `items` is a record of `OpertationMenuItem` objects.                                            |
| `selection`     | `TableCellSelection` object | `#0589f3`        | Configuration for table cell selection, primarily `primaryColor` for border color.                                                                                                                                          |
| `dragResize`    | `boolean`                   | `true`           | Enables or disables dragging to resize table cell widths.                                                                                                                                                                   |
| `customButton`  | `string`                    | `'自定义行列数'` | Defines the label for a custom table button (likely for internal UI within the table module, not the main toolbar insertion button).                                                                                        |

### `ToolTip` Options

| Attribute          | Type       | Default | Description                                      |
| :----------------- | :--------- | :------ | :----------------------------------------------- |
| `tipHeight`        | `number`   | `12px`  | Height of the slider.                            |
| `disableToolNames` | `string[]` |         | Array of tool names to disable within the table. |

### `OperationMenu` Options

| Attribute      | Type                                 | Default                                                        | Description                                                                                                          |
| :------------- | :----------------------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `items`        | `Record<string, OpertationMenuItem>` | Default actions (insert/remove column/row, merge cell, colors) | Defines the context menu items. Each item is an `OpertationMenuItem`.                                                |
| `replaceItems` | `boolean`                            | `false`                                                        | If `true`, custom `items` will entirely replace default context menu items. If `false`, custom items will be merged. |
| `modifyItems`  | `boolean`                            | `false`                                                        | If `true`, allows modification of default context menu items.                                                        |

#### `OpertationMenuItem` Structure

| Attribute       | Type                                            | Description                                                                    |
| :-------------- | :---------------------------------------------- | :----------------------------------------------------------------------------- |
| `text`          | `string` / `() => HTMLElement \| HTMLElement[]` | Text or HTML elements for the menu item.                                       |
| `iconSrc`       | `HTMLString`                                    | Pre-icon for the menu item.                                                    |
| `handler`       | `() => void` / `(color) => void`                | Function to execute on click, or on color input for color choosers.            |
| `subTitle`      | `string`                                        | Subtitle for the menu item.                                                    |
| `groupEnd`      | `boolean`                                       | If `true`, adds a group underline after this item.                             |
| `isColorChoose` | `boolean`                                       | If `true`, this item acts as a color picker, and `handler` receives the color. |

### `TableCellSelection` Options

| Attribute      | Type     | Default   | Description                      |
| :------------- | :------- | :-------- | :------------------------------- |
| `primaryColor` | `string` | `#0589f3` | Border color for cell selection. |

## 5. `rewirteFormats()` Function

The `rewirteFormats()` function is a critical utility provided by this module. Its purpose is to handle exceptions and ensure that certain native Quill formats (specifically, `ListItem`) display and behave correctly when applied within table cells. It rewrites the `replaceWith` method for `ListItem` to properly render unordered (`ul`) and ordered (`ol`) lists inside cells.

It is recommended to always call `rewirteFormats()` after registering the module to avoid potential display issues with relevant formats inside tables.
