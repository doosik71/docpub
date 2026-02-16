# Yjs Usage Guide

This document provides an overview of Yjs, a powerful framework for building collaborative applications. It covers installation, core concepts, main data types, Awareness, and common usage patterns. This guide synthesizes information from the Yjs source code and its official documentation. For the most comprehensive and up-to-date information, always refer to the [official Yjs documentation](https://docs.yjs.dev).

## 1. Introduction

Yjs is a high-performance, real-time collaborative editing framework. It uses Conflict-free Replicated Data Types (CRDTs) to enable seamless, offline-first, and peer-to-peer collaboration on any data structure. Yjs handles data synchronization, conflict resolution, and versioning automatically, allowing developers to focus on application logic.

## 2. Installation

Yjs can be installed via npm:

```bash
npm install yjs
```

_(Note: As per `package.json` in the main project, Yjs is already installed.)_

## 3. Core Concepts

### 3.1. `Y.Doc` (Document)

The `Y.Doc` is the central component of Yjs. It represents a single collaborative document or state tree. All shared data types (like `Y.Text`, `Y.Map`, `Y.Array`) live within a `Y.Doc`. Changes made to a `Y.Doc` can be efficiently synchronized across multiple clients.

```javascript
import * as Y from "yjs";

const ydoc = new Y.Doc();
```

### 3.2. Conflict-free Replicated Data Types (CRDTs)

Yjs implements various CRDTs, which are data structures that can be replicated across multiple machines and concurrently updated without requiring a central authority to resolve conflicts. Conflicts are resolved deterministically and automatically. This is the foundation of Yjs's offline-first and real-time capabilities.

### 3.3. Update Protocol

Yjs uses a highly optimized binary update protocol to synchronize changes between `Y.Doc` instances. Updates are small, incremental, and contain all necessary information for conflict resolution. Functions like `applyUpdate`, `encodeStateAsUpdate`, `encodeStateVector`, and `mergeUpdates` are part of this protocol.

### 3.4. Providers

While Yjs itself handles the local CRDT logic, **providers** are external modules that handle the actual network communication and persistence layer. They connect `Y.Doc` instances across different clients. Common providers include:

- `y-websocket`: For WebSocket-based synchronization.
- `y-webrtc`: For peer-to-peer synchronization via WebRTC.
- `y-indexeddb`: For local persistence in browsers.
- `y-leveldb`: For local persistence in Node.js.

```javascript
// Example using y-websocket provider
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const ydoc = new Y.Doc();
const wsProvider = new WebsocketProvider(
  "ws://localhost:1234", // WebSocket server URL
  "my-document-name", // Document name
  ydoc,
);
```

### 3.5. Awareness Protocol

The **Awareness** protocol is a separate, but often used, mechanism for sharing _transient_ user states that are not part of the document itself. This includes things like:

- User cursor positions
- User selection ranges
- User names and colors
- User presence (online/offline)

Awareness states are not persistent and are typically managed by providers (e.g., `wsProvider.awareness`).

```javascript
// Example of setting local awareness state
wsProvider.awareness.setLocalStateField("user", {
  name: "John Doe",
  color: "#FF0000",
});

// Example of observing remote awareness states
wsProvider.awareness.on("update", ({ added, updated, removed }) => {
  // Handle added, updated, or removed remote user states
  const users = Array.from(wsProvider.awareness.getStates().values());
  console.log("Connected users:", users);
});
```

## 4. Main Shared Data Types

Yjs provides several observable data types that can be directly modified and collaboratively edited.

### 4.1. `Y.Text`

A collaborative string data type, optimized for rich-text editing. Ideal for binding with rich text editors like Quill.

```javascript
const ytext = ydoc.getText("my-richtext-content");

ytext.insert(0, "Hello ");
ytext.insert(6, "World!");
ytext.delete(0, 5); // ' World!'
```

### 4.2. `Y.Map`

A collaborative key-value store, similar to JavaScript's `Map` or a JSON object. Keys are strings, and values can be any Yjs shared type or basic JSON-serializable data.

```javascript
const ymap = ydoc.getMap("my-settings");

ymap.set("theme", "dark");
ymap.set("fontSize", 16);
ymap.observe((event) => {
  console.log(`Map changed: ${event.keysChanged}`);
});
```

### 4.3. `Y.Array`

A collaborative array data type, similar to JavaScript's `Array`. It can store any Yjs shared type or basic JSON-serializable data.

```javascript
const yarray = ydoc.getArray("my-todo-list");

yarray.insert(0, ["Buy groceries"]);
yarray.push(["Walk the dog"]);
yarray.delete(0, 1);
```

### 4.4. XML Types (`Y.XmlElement`, `Y.XmlText`, `Y.XmlFragment`)

For collaborative editing of XML or HTML-like structures, Yjs provides specialized XML types.

## 5. Transactions

All changes to a `Y.Doc` are grouped into **transactions**. A transaction ensures atomicity; either all changes within it are applied successfully, or none are. Transactions also batch updates, improving performance. You can explicitly create a transaction using `ydoc.transact(() => { /* changes */ })`.

```javascript
ydoc.transact(() => {
  ytext.insert(0, "Start ");
  ytext.insert(6, "End");
}); // All changes applied in one go
```

## 6. Undo/Redo (`UndoManager`)

Yjs provides an `UndoManager` to easily add undo/redo functionality to your collaborative document.

```javascript
import { UndoManager } from "yjs";

const undoManager = new UndoManager(ytext); // Can target a specific shared type

// When changes occur (e.g., ytext.insert(..))
// undoManager.undo();
// undoManager.redo();
```

## 7. Snapshots

Yjs allows creating **snapshots** of the document state at a particular point in time. Snapshots are efficient and can be used for:

- Saving document history.
- "Time-traveling" to previous states.
- Optimizing initial synchronization.

```javascript
import { createSnapshot, applyUpdate, encodeStateAsUpdate } from "yjs";

const snapshot = createSnapshot(ydoc);
const update = encodeStateAsUpdate(ydoc); // Or use other update functions
// To restore from snapshot (conceptually)
// ydoc.applyUpdate(updateFromSnapshot);
```

## 8. Offline-First Capabilities

Due to its CRDT foundation, Yjs works seamlessly offline. Changes made while offline are automatically merged with remote changes once a connection is re-established, without data loss or manual conflict resolution.

## 9. Best Practices

- **Import only once:** Ensure Yjs is imported only once in your application to avoid issues with constructor checks (as warned in `src/index.js`).
- **Use `Y.Doc` roots:** Access shared types using `ydoc.getText('name')`, `ydoc.getMap('name')`, etc., to get or create root-level shared types.
- **Leverage providers:** Use appropriate Yjs providers for network synchronization and persistence.
- **Utilize Awareness:** For UI elements like cursors and presence, use the Awareness protocol.
- **Refer to official documentation:** `https://docs.yjs.dev` is the definitive source for detailed API usage and advanced patterns.
