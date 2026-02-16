# `y-quill` Usage Guide

This document provides a guide to using the `y-quill` package, which enables collaborative editing in QuillJS through Yjs. This guide is based on the analysis of the provided source code and `README.md`.

## 1. Introduction

`y-quill` is a binding library that connects a [Quill Editor](https://quilljs.com/) instance with a [Yjs](https://yjs.dev/) document's `Y.Text` type. This integration allows for real-time, peer-to-peer collaborative editing experiences in applications. It also provides optional support for shared cursors through the [quill-cursors](https://github.com/reedsy/quill-cursors) module.

## 2. Installation

The package can be installed via npm:

```bash
npm install y-quill
```

_(Note: As per `package.json` in the main project, this package is already installed.)_

Additionally, you will need `quill` and `yjs`, and optionally `quill-cursors` for shared cursor functionality.

```bash
npm install quill yjs quill-cursors
```

## 3. Core Concepts

### 3.1. Yjs (`Y.Doc` and `Y.Text`)

Yjs is a CRDT (Conflict-free Replicated Data Type) framework that enables real-time collaboration.

- **`Y.Doc`**: The central document managed by Yjs, representing the shared state.
- **`Y.Text`**: A specific Yjs data type optimized for collaborative text editing. `y-quill` binds a Quill editor to a `Y.Text` instance, ensuring that changes in Quill are reflected in `Y.Text` and vice-versa across all connected clients.

### 3.2. Awareness

The Yjs **Awareness** protocol is used to share transient, non-document-related state among collaborators, such as cursor positions, user names, and colors. `y-quill` leverages this to display shared cursors if `quill-cursors` is integrated.

## 4. Basic Usage

Here's how to set up `y-quill` to enable collaborative editing with Quill and Yjs:

### 4.1. Import necessary components

Import `QuillBinding`, `Quill`, and if you plan to use shared cursors, `QuillCursors`. You'll also need `Yjs` and a Yjs provider (e.g., `y-websocket`, `@hocuspocus/provider`).

```javascript
import { QuillBinding } from "y-quill";
import Quill from "quill";
import QuillCursors from "quill-cursors"; // Optional, for shared cursors
import * as Y from "yjs";
// import { WebsocketProvider } from 'y-websocket'; // Example Yjs provider
// or
// import { HocuspocusProvider } from '@hocuspocus/provider'; // Example Yjs provider
```

### 4.2. Register `QuillCursors` (Optional)

If you want shared cursors, register `QuillCursors` as a Quill module _before_ initializing your Quill instance.

```javascript
Quill.register("modules/cursors", QuillCursors);
```

### 4.3. Initialize Yjs and its Provider

Create a `Y.Doc` instance and connect it to a Yjs provider (e.g., `WebsocketProvider` or `HocuspocusProvider`) to handle document synchronization.

```javascript
const ydoc = new Y.Doc();
// Example with HocuspocusProvider (used in the main project)
const provider = new HocuspocusProvider({
  url: "ws://localhost:3000/hocuspocus", // Your Hocuspocus server URL
  name: "my-document-id", // Unique document identifier
  document: ydoc,
});

// Or with y-websocket:
// const provider = new WebsocketProvider(
//   'ws://localhost:1234', // Your WebSocket server URL
//   'my-document-id',    // Unique document identifier
//   ydoc
// );
```

### 4.4. Initialize Quill Editor

Create your Quill editor instance, configuring its modules as needed. If using `quill-cursors`, enable the `cursors` module.

```javascript
const editor = new Quill("#editor-container", {
  modules: {
    cursors: true, // Enable if using QuillCursors
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      ["image", "code-block"],
    ],
  },
  placeholder: "Start collaborating...",
  theme: "snow", // or 'bubble'
});
```

### 4.5. Create `Y.Text` and Instantiate `QuillBinding`

Get a `Y.Text` type from your `ydoc` and then create a `QuillBinding` instance. Pass the `Y.Text` type, the Quill editor instance, and optionally the provider's `awareness` instance.

```javascript
const ytext = ydoc.getText("quill"); // 'quill' is the shared text type name

// The core binding
const binding = new QuillBinding(ytext, editor, provider.awareness);
```

### 4.6. Configure User Awareness (Optional)

If you passed an `awareness` instance to `QuillBinding`, you can set local user information that will be shared among collaborators (e.g., for displaying names next to cursors).

```javascript
provider.awareness.setLocalStateField("user", {
  name: "John Doe",
  color: "#FF0000", // Hex color for the user's cursor
});
```

## 5. API

The primary class for `y-quill` is `QuillBinding`.

### `new QuillBinding(ytext: Y.Text, quill: Quill, awareness?: Awareness)`

- **`ytext`**: The `Y.Text` instance from your `Y.Doc` that `y-quill` will bind to.
- **`quill`**: The Quill editor instance.
- **`awareness`**: (Optional) An `Awareness` instance from your Yjs provider. If provided, `y-quill` will enable shared cursor functionality.

### Methods

- `destroy()`: Cleans up event listeners and disposes of the binding, stopping collaboration for this specific editor instance. It's important to call this when the editor is unmounted or no longer needed to prevent memory leaks.

## 6. Example Flow (Simplified)

```javascript
// 1. Import dependencies
import { QuillBinding } from 'y-quill';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import * => Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider'; // Or other Yjs provider

// 2. Register Quill Cursors
Quill.register('modules/cursors', QuillCursors);

// 3. Initialize Yjs and provider
const ydoc = new Y.Doc();
const provider = new HocuspocusProvider({
  url: 'ws://localhost:3000/hocuspocus',
  name: 'document-123',
  document: ydoc,
});

// 4. Initialize Quill Editor
const quill = new Quill('#editor-container', {
  modules: {
    cursors: true,
    toolbar: [['bold', 'italic'], ['blockquote']]
  },
  theme: 'snow',
  placeholder: 'Start typing collaboratively...'
});

// 5. Create Y.Text and Bind Quill
const ytext = ydoc.getText('quill-content');
const binding = new QuillBinding(ytext, quill, provider.awareness);

// 6. Set User Awareness (optional)
provider.awareness.setLocalStateField('user', {
  name: 'Collaborator ' + Math.floor(Math.random() * 100),
  color: '#' + Math.floor(Math.random() * 16777215).toString(16)
});

// When the component unmounts or editor is no longer needed:
// binding.destroy();
// provider.destroy();
```

For a more detailed working example, refer to the [Yjs Demos repository](https://github.com/y-js/yjs-demos/tree/master/quill).
