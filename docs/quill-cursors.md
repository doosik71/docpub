# `quill-cursors` Usage Guide

This document provides a guide to using the `quill-cursors` package, a Quill module designed to display multi-user cursors for collaborative editing. This guide is based on the analysis of its `README.md` and common usage patterns in collaborative Quill setups (e.g., with Yjs).

## 1. Introduction

`quill-cursors` is a QuillJS module that facilitates the visualization of other users' cursor positions and selections in a shared editing environment. It's an essential component for providing a rich collaborative experience in real-time text editors.

## 2. Installation

The package can be installed via npm:

```bash
npm install quill-cursors
```

_(Note: As per `package.json` in the main project, this package is already installed.)_

## 3. Basic Usage

To integrate `quill-cursors` into your Quill editor:

### 3.1. Import and Register the Module

First, import `QuillCursors` and register it as a module with Quill. This should be done before initializing your Quill editor instance.

```javascript
import Quill from "quill";
import QuillCursors from "quill-cursors";

// Register the cursors module with Quill
Quill.register("modules/cursors", QuillCursors);
```

### 3.2. Initialize Quill Editor with Cursors Module

When initializing your Quill editor, enable the `cursors` module in the `modules` configuration.

```javascript
const quill = new Quill("#editor", {
  modules: {
    cursors: true, // Enable the cursors module
    toolbar: [
      // ... your toolbar items
    ],
  },
  theme: "snow", // or 'bubble'
  placeholder: "Start collaborating...",
});
```

### 3.3. Get the Cursors Module Instance

You can retrieve the `quill-cursors` module instance from your Quill editor to access its API methods.

```javascript
const cursors = quill.getModule("cursors");
```

## 4. API Reference

The `quill-cursors` module instance provides the following methods to manage cursors:

### `createCursor(id: string, name: string, color: string): Cursor`

Creates a new cursor for a given user. If a cursor with the provided `id` already exists, it will not create a new one but return the existing `Cursor` object.

- `id` (string): A unique identifier for the user/cursor. This ID is used to manage the cursor later.
- `name` (string): The name to be displayed on the cursor's flag (e.g., "John Doe").
- `color` (string): The CSS color value for the cursor (e.g., "#FF0000", "blue").

Returns a `Cursor` object:

```typescript
{
  id: string;
  name: string;
  color: string;
  range: Range; // The current selection range of the cursor
}
```

### `moveCursor(id: string, range: QuillRange): void`

Updates the selection range (position and length) of an existing cursor.

- `id` (string): The ID of the cursor to move.
- `range` ([`QuillRange`](https://quilljs.com/docs/api/#selection-change)): An object `{ index: number, length: number }` representing the new selection.

### `removeCursor(id: string): void`

Removes a specific cursor from the editor's DOM.

- `id` (string): The ID of the cursor to remove.

### `update(): void`

Redraws all active cursors in the DOM. This can be useful after significant editor changes or layout adjustments.

### `clearCursors(): void`

Removes all cursors currently displayed in the editor from the DOM.

### `toggleFlag(id: string, shouldShow?: boolean): void`

Toggles the visibility of the username flag associated with a cursor.

- `id` (string): The ID of the cursor whose flag should be toggled.
- `shouldShow` (boolean, optional): If `true`, the flag will be shown. If `false`, it will be hidden. If omitted, the flag's current display state will be inverted.

### `cursors(): Cursor[]`

Returns an array of all `Cursor` objects currently managed by the module.

## 5. Configuration Options

You can customize the behavior and appearance of `quill-cursors` by passing an options object to the `cursors` module in your Quill configuration:

```javascript
const quill = new Quill("#editor", {
  modules: {
    cursors: {
      template:
        '<div class="ql-cursor-custom"><div class="ql-cursor-flag"></div><div class="ql-cursor-caret"></div></div>',
      containerClass: "my-custom-cursors-container",
      hideDelayMs: 5000,
      hideSpeedMs: 0,
      selectionChangeSource: null,
      transformOnTextChange: true,
      boundsContainer: document.getElementById("my-editor-container"),
      positionFlag: (flag, caretRectangle, container) => {
        /* custom positioning logic */
      },
    },
  },
});
```

| Option                  | Type                                       | Default                    | Description                                                                                                                                                                                                                                                                                                    |
| :---------------------- | :----------------------------------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `template`              | `string`                                   | Default HTML template      | Custom HTML string to use for a cursor. It should include classes like `ql-cursor-flag` and `ql-cursor-caret` for proper styling and functionality.                                                                                                                                                            |
| `containerClass`        | `string`                                   | `'ql-cursors'`             | The CSS class added to the container `div` that holds all cursors. Useful for custom styling of the cursors container.                                                                                                                                                                                         |
| `hideDelayMs`           | `number`                                   | `3000`                     | The number of milliseconds to show the username flag before it starts hiding. Set to `0` to disable the delay.                                                                                                                                                                                                 |
| `hideSpeedMs`           | `number`                                   | `400`                      | The duration of the flag hiding animation in milliseconds. Set to `0` to hide instantly.                                                                                                                                                                                                                       |
| `selectionChangeSource` | `string` or `null`                         | `'api'`                    | Controls the `source` argument (`'api'`, `'user'`, `'silent'`) used when `quill-cursors` emits a `selection-change` event on `text-change`. If `null`, no `selection-change` event will be emitted on `text-change` by `quill-cursors`. This helps differentiate internal cursor updates from user actions.    |
| `transformOnTextChange` | `boolean`                                  | `false`                    | If `true`, the module will attempt to locally infer and update cursor positions when the editor content changes (e.g., due to a local user's typing), even without an explicit update from the remote client. This can provide smoother visual performance on high-latency connections.                        |
| `boundsContainer`       | `HTMLElement`                              | Quill's `bounds` container | The HTML element used as the reference container for positioning the cursor flags. By default, it uses Quill's `bounds` option.                                                                                                                                                                                |
| `positionFlag`          | `(flag, caretRect, containerRect) => void` | Default logic              | A custom function to define how the cursor flag should be positioned. It receives the `flag` HTMLElement, the `caretRectangle` (ClientRect of the caret), and the `containerRect` (ClientRect of the `boundsContainer`). By default, the flag flips horizontally when it reaches the right edge of the bounds. |

## 6. Integration with Yjs (`y-quill`)

`quill-cursors` is frequently used with Yjs via the `y-quill` binding for real-time collaborative editing. `y-quill` provides an `awareness` instance from Yjs, which `quill-cursors` can use to automatically update and display remote users' cursor positions and states.

When using `y-quill`, you typically pass the `provider.awareness` instance to the `QuillBinding` constructor:

```javascript
import { QuillBinding } from "y-quill";
// ... other imports

const binding = new QuillBinding(ytext, quill, provider.awareness);
```

The `awareness` instance automatically manages remote users' cursor data (via `awareness.setLocalStateField('cursor', { anchor, head })`) which `quill-cursors` then visualizes. You would usually set `name` and `color` in the `user` field of the awareness state.

## 7. License

This project is licensed under the MIT License.

```
I will now write this content to `docs/quill-cursors.md`.
```
