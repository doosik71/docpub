# `@hocuspocus/common` Usage Guide

This document outlines the purpose and functionalities of the `@hocuspocus/common` package within the broader Hocuspocus ecosystem. This guide is based on the analysis of its source code (`hocuspocus-common.cjs`), `package.json`, and `README.md`.

## 1. Introduction

The `@hocuspocus/common` package serves as a foundational utility library for various Hocuspocus-related packages (e.g., `@hocuspocus/provider`, `@hocuspocus/server`). It provides shared code, including low-level encoding/decoding utilities, authentication message protocols, and WebSocket-related constants, ensuring consistency and efficiency across the Hocuspocus architecture. It is not intended for direct high-level application development but rather as an internal dependency.

## 2. Installation

While typically installed as a dependency of other Hocuspocus packages, you can install it explicitly via npm if needed:

```bash
npm install @hocuspocus/common
```
*(Note: This package is likely already a transitive dependency if you are using `@hocuspocus/provider` or `@hocuspocus/server`.)*

## 3. Key Functionalities and Usage

The `hocuspocus-common.cjs` module exports several categories of utilities. Application developers primarily building on Hocuspocus may find themselves interacting with these utilities for advanced customization, debugging, or when extending Hocuspocus's core functionalities.

### 3.1. Binary Encoding and Decoding Utilities

This package provides efficient, low-level functions for serializing and deserializing data. These are crucial for optimizing network communication, especially for Yjs updates.

*   **`write(encoder, num)`**: Writes a single byte to an encoder.
*   **`writeVarUint(encoder, num)`**: Writes a variable-length unsigned integer.
*   **`writeVarString(encoder, str)`**: Writes a variable-length string, with optimizations for native `TextEncoder.encodeInto`.
*   **`writeUint8Array(encoder, uint8Array)`**: Appends a fixed-length `Uint8Array`.
*   **`writeVarUint8Array(encoder, uint8Array)`**: Appends a variable-length `Uint8Array`.
*   **`readUint8Array(decoder, len)`**: Reads a fixed-length `Uint8Array`.
*   **`readVarUint8Array(decoder)`**: Reads a variable-length `Uint8Array`.
*   **`readUint8(decoder)`**: Reads a single byte as an unsigned integer.
*   **`readVarUint(decoder)`**: Reads a variable-length unsigned integer.
*   **`readVarString(decoder)`**: Reads a variable-length string.

These functions are part of a custom binary encoding scheme, often used with `lib0` (a Yjs utility library) for compact data representation.

**Example (Conceptual - requires `lib0` Encoder/Decoder instances):**

```javascript
// This is conceptual usage and assumes you have `Encoder` and `Decoder`
// instances from `lib0` or similar context.
import { createEncoder, toUint8Array } from 'lib0/encoding';
import { createDecoder, hasContent } from 'lib0/decoding';
import {
  writeVarUint, writeVarString, readVarUint, readVarString
} from '@hocuspocus/common/dist/hocuspocus-common.cjs'; // Direct import from CJS

const encoder = createEncoder();
writeVarUint(encoder, 12345);
writeVarString(encoder, 'Hello Hocuspocus!');
const encodedData = toUint8Array(encoder);

const decoder = createDecoder(encodedData);
const num = readVarUint(decoder); // 12345
const str = readVarString(decoder); // 'Hello Hocuspocus!'
console.log(num, str, hasContent(decoder)); // 12345, 'Hello Hocuspocus!', false
```

### 3.2. Authentication Message Types and Handlers

The package defines an enumeration for authentication message types and helper functions for creating and reading these messages, primarily used in client-server communication for authentication flows.

#### `AuthMessageType` Enum

```javascript
// From hocuspocus-common.cjs
exports.AuthMessageType = {
  Token: 0,
  PermissionDenied: 1,
  Authenticated: 2
};
```
*   `AuthMessageType.Token`: Indicates a token request or transmission.
*   `AuthMessageType.PermissionDenied`: Signifies that a permission request was denied, typically with a reason.
*   `AuthMessageType.Authenticated`: Confirms successful authentication, potentially with a scope.

#### Authentication Message Writers

Functions to write specific authentication messages into an encoder:

*   **`writeAuthentication(encoder, auth)`**: Writes an authentication token.
*   **`writePermissionDenied(encoder, reason)`**: Writes a permission denied message with a given reason.
*   **`writeAuthenticated(encoder, scope)`**: Writes an authenticated message with a given scope.
*   **`writeTokenSyncRequest(encoder)`**: Writes a request for a token sync.

#### Authentication Message Reader

*   **`readAuthMessage(decoder, sendToken, permissionDeniedHandler, authenticatedHandler)`**: Reads an authentication message from a decoder and executes the appropriate handler based on the message type.
    *   `sendToken()`: Callback for `AuthMessageType.Token`.
    *   `permissionDeniedHandler(reason)`: Callback for `AuthMessageType.PermissionDenied`.
    *   `authenticatedHandler(scope)`: Callback for `AuthMessageType.Authenticated`.

**Example Usage (Conceptual):**

```javascript
// Assuming `decoder` is a lib0/decoding decoder
import {
  AuthMessageType, readAuthMessage
} from '@hocuspocus/common/dist/hocuspocus-common.cjs';

const sendToken = () => console.log('Client needs to send a token.');
const permissionDenied = (reason) => console.error('Permission Denied:', reason);
const authenticated = (scope) => console.log('Authenticated with scope:', scope);

// Imagine `decoder` contains an authentication message
// readAuthMessage(decoder, sendToken, permissionDenied, authenticated);
```

### 3.3. WebSocket Close Codes and Reasons

The package provides constants for standard and custom WebSocket close codes used within the Hocuspocus protocol. These are useful for handling and interpreting WebSocket disconnections.

*   **`MessageTooBig`**: `{ code: 1009, reason: "Message Too Big" }`
*   **`ResetConnection`**: `{ code: 4205, reason: "Reset Connection" }`
*   **`Unauthorized`**: `{ code: 4401, reason: "Unauthorized" }`
*   **`Forbidden`**: `{ code: 4403, reason: "Forbidden" }`
*   **`ConnectionTimeout`**: `{ code: 4408, reason: "Connection Timeout" }`

These can be imported and used to compare against `CloseEvent.code` and `CloseEvent.reason` when handling WebSocket closures.

### 3.4. Awareness Helpers

*   **`awarenessStatesToArray(states)`**: Converts an `Awareness` states `Map` (where keys are client IDs and values are state objects) into an array of objects, each containing a `clientId` and the corresponding state. This simplifies processing awareness data for UI display.

### 3.5. WebSocket Ready States

*   **`WsReadyStates` Enum**: Defines the standard WebSocket `readyState` values:
    *   `WsReadyStates.Connecting` (`0`)
    *   `WsReadyStates.Open` (`1`)
    *   `WsReadyStates.Closing` (`2`)
    *   `WsReadyStates.Closed` (`3`)

These can be used for checking the connection status of a WebSocket.

## 4. Conclusion

`@hocuspocus/common` is a vital internal component of the Hocuspocus collaborative editing framework. While not typically interacted with directly by end-application developers for high-level features, its exported utilities are essential for deep customization, extending Hocuspocus, or debugging network and authentication issues. Understanding its contents provides insight into the low-level workings of Hocuspocus.
