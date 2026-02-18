# Document Version Control Development Plan

## 1. Overall Goal

Implement a robust document version control system to allow users to track changes, view historical versions, and potentially restore previous states of their documents. This system aims to provide a balance between data fidelity and human readability for version history.

## 2. Rationale for Approach

### Problem Statement

Existing document storage overwrites the previous state, offering no history. Direct versioning of Yjs binary states (`.bin` files) ensures full data fidelity (no loss of formatting or collaborative history), but these binaries are not human-readable or diffable. Converting the entire document to Markdown for versioning, while human-readable, risks losing rich formatting present in Quill.

### Chosen Approach: Hybrid Versioning

The chosen approach combines the strengths of both methods:

- **Full Yjs Binary State Storage:** For each version, the complete Yjs document state (`.bin` file) will be saved. This guarantees that any historical version can be fully restored without loss of collaborative history or rich formatting.
- **Human-Readable Summary (Markdown/Delta JSON):** Alongside each binary version, a human-readable summary (Markdown) and the Quill Delta JSON will be stored. This summary will be used for displaying version history, providing diff previews, and facilitating content search without needing to process the binary state.

This approach addresses the user's concern about preserving document fidelity while also providing the benefits of human-readable version history.

## 3. Backend Modifications (`src/app/api/documents/route.js`)

The backend will be responsible for storing and retrieving document versions.

### 3.1. File Structure Changes

- **Root Document Directory:** `documents/` at the project root (`process.cwd()`).
- **Per-Document Directory:** Each document will have its own subdirectory within `documents/`, named after its `documentId` (e.g., `documents/your-doc-id-123/`).
- **Latest State:** Inside each document's directory, the latest Yjs binary state will be saved as `latest.bin`.
- **Versions Subdirectory:** Within each document's directory, a `versions/` subdirectory will store historical versions (e.g., `documents/your-doc-id-123/versions/`).
- **Version Files:** Each historical version will consist of two files:
  - A Yjs binary state: `documents/<documentId>/versions/<timestamp>.bin`
  - A metadata/summary file: `documents/<documentId>/versions/<timestamp>.json`

### 3.2. Update Imports

Add the `converter` import:

```javascript
import converter from "@workiom/delta-md-converter"; // New import
```

### 3.3. Modified `POST` Handler (`export async function POST(request)`)

- **Input:** Will now accept `id`, `state` (Yjs binary base64), `delta` (Quill Delta JSON), and `markdownSummary` from the frontend.
- **Directory Creation:** Ensure `documents/<documentId>/` and `documents/<documentId>/versions/` directories exist.
- **Save Latest State:** Overwrite `documents/<documentId>/latest.bin` with the incoming `binaryState`.
- **Generate Timestamp:** Create a unique timestamp (e.g., `YYYYMMDDHHmmssSSS`).
- **Save Versioned Binary:** Save the incoming `binaryState` to `documents/<documentId>/versions/<timestamp>.bin`.
- **Extract/Infer Title:**
  - Prioritize title from Quill Delta if available (e.g., first text block).
  - Fallback to reconstructing `YDoc` from `binaryState` to extract title from `metadata` map (though this is less ideal due to the server-side Yjs reconstruction issue).
- **Create Version Metadata:** Assemble a JSON object with `timestamp`, `author`, `title`, `summary_markdown`, and `delta`.
- **Save Version Metadata:** Write this JSON object to `documents/<documentId>/versions/<timestamp>.json`.

### 3.4. Modified `GET` Handler (`export async function GET(request)`)

- **Specific Document Retrieval:** If `documentId` is provided in query, load `documents/<documentId>/latest.bin`.
- **Document List Retrieval:**
  - Iterate through subdirectories in `documents/` to find each `documentId`.
  - For each `documentId`, attempt to read `documents/<documentId>/latest.bin`.
  - Reconstruct `YDoc` from `latest.bin` to extract `title`, `saved_at`, `saved_by`, and content for search filtering.
  - **Note on Yjs Server-Side Issue:** This step is currently vulnerable to the `TypeError` during `Y.applyUpdate`. While the `next.config.js` change aims to mitigate this, if it persists, metadata extraction for listing might need to be refined (e.g., caching metadata from the `POST` request or relying on a separate metadata file for each document, not just versions). For now, the existing `try-catch` block will handle potential failures gracefully, albeit with potentially incomplete metadata for listing.

### 3.5. Modified `DELETE` Handler (`export async function DELETE(request)`)

- **Recursive Deletion:** Delete the entire `documents/<documentId>/` directory recursively, including `latest.bin` and the `versions/` subdirectory.

### 3.6. New API Endpoints

- **`export async function GET_VERSIONS(request)`:**
  - Endpoint: `/api/documents/versions?id=<documentId>`
  - Function: Lists all historical versions for a given `documentId`.
  - Logic: Reads `documents/<documentId>/versions/<timestamp>.json` files, parses their metadata, sorts by timestamp, and returns a list.
- **`export async function GET_VERSION_CONTENT(request)`:**
  - Endpoint: `/api/documents/version-content?id=<documentId>&timestamp=<timestamp>&format=<format>`
  - Function: Retrieves specific content of a historical version.
  - `format` options:
    - `binary`: Returns the base64 encoded content of `documents/<documentId>/versions/<timestamp>.bin`.
    - `delta`: Returns the `delta` JSON from `documents/<documentId>/versions/<timestamp>.json`.
    - `markdown`: Returns the `summary_markdown` from `documents/<documentId>/versions/<timestamp>.json`.

## 4. Frontend Modifications (`src/app/doc/[documentId]/page.jsx`)

The frontend will be updated to provide the necessary data to the backend during save operations and later to display version history.

### 4.1. Update Imports

- Add `import converter from "@workiom/delta-md-converter";`

### 4.2. Modify `handleSaveDocument` and `Ctrl+S` Keyboard Shortcut

- **Extract Quill Delta:** Obtain the current Quill Delta using `editorRef.current.getQuill().getContents()`.
- **Convert to Markdown:** Use `converter.deltaToMarkdown()` to convert the Delta to a Markdown string.
- **Send to Backend:** Include `paramDocumentId` (as `id`), the Yjs binary `state`, the Quill `delta` JSON, and the `markdownSummary` in the `POST` request body to `/api/documents`.

## 5. Technical Considerations and Challenges

### 5.1. Yjs Server-Side `TypeError`

- **Issue:** The `TypeError: contentRefs[...] is not a function` during `Y.applyUpdate` on the server suggests a deep-seated incompatibility or bundling issue when `yjs` is used within the Next.js server environment.
- **Mitigation (Backend `GET` and `POST` title extraction):** The `next.config.js` externalization of `yjs` is a primary attempt to resolve this. If the issue persists, the backend's reliance on `Y.applyUpdate` for metadata extraction (especially in the `GET` handler for listing) might lead to incomplete information for some documents.
- **Frontend Workaround:** By passing `delta` and `markdownSummary` directly from the frontend on save, we circumvent the need for server-side `YDoc` reconstruction for generating version summaries, making the `POST` versioning more robust.

### 5.2. Encoding for Korean Characters

- **Yjs Binary:** Yjs handles Unicode internally, so the binary state itself should store Korean characters correctly.
- **Markdown/JSON Files:** Node.js `fs.promises.writeFile` defaults to UTF-8, which correctly handles Korean characters in the Markdown summaries and JSON metadata files. The `@workiom/delta-md-converter` should also handle Unicode characters correctly during conversion.

## 6. Future Enhancements (Frontend UI for Version History)

- A new UI component or modal to:
  - Fetch and display the list of versions for the current document using `GET_VERSIONS`.
  - Show version metadata (timestamp, author, title, truncated markdown summary).
  - Allow users to view a full historical Markdown version (using `GET_VERSION_CONTENT` with `format=markdown`).
  - Implement a "Restore" feature that fetches a historical Yjs binary state (using `GET_VERSION_CONTENT` with `format=binary`) and loads it into the editor, potentially as a new document or prompting a save.
