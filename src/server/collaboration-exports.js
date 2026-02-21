import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hocuspocus Configuration
export const hocuspocusConfiguration = {
  async onLoadDocument(data) {
    const documentId = data.documentName;
    const docPath = path.join(__dirname, `../../documents/${documentId}`); // Document-specific folder
    const filePath = path.join(docPath, `latest.bin`); // Use latest.bin inside the folder
    const ydoc = new Y.Doc();

    // Ensure the document-specific directory exists before trying to read
    await fs.promises.mkdir(docPath, { recursive: true });

    if (fs.existsSync(filePath)) {
      const encodedState = fs.readFileSync(filePath);

      try {
        Y.applyUpdate(ydoc, encodedState);
      } catch (updateError) {
        console.error(
          `[Hocuspocus] Error applying Y.Doc update for ${filePath}:`,
          updateError,
        );
        console.error(
          `[Hocuspocus] Corrupted file content for ${filePath}. Length: ${encodedState.length}`,
        );
        console.error(
          `[Hocuspocus] Corrupted content (first 50 bytes base64): ${encodedState.toString("base64").substring(0, 50)}`,
        );
        return ydoc;
      }
      console.log(`Loaded document state for ${documentId}`);
    } else {
      console.log(`Document not found, creating new: ${documentId}`);
    }
    return ydoc;
  },

  async onStoreDocument(data) {
    // console.log(
    //   `[Hocuspocus] onStoreDocument called for document: ${data.documentName}`,
    // );
    const documentId = data.documentName;
    const docPath = path.join(__dirname, `../../documents/${documentId}`); // Document-specific folder
    const filePath = path.join(docPath, `latest.bin`); // Use latest.bin inside the folder

    // Ensure the document-specific directory exists before trying to write
    await fs.promises.mkdir(docPath, { recursive: true });

    try {
      const encodedState = Y.encodeStateAsUpdate(data.document);
      // console.log(
      //   `[Hocuspocus] Storing document ${documentId}: encodedState size = ${encodedState.length} bytes.`,
      // );
      fs.writeFileSync(filePath, Buffer.from(encodedState));
      console.log(
        `[Hocuspocus] Successfully stored document: ${documentId} to ${filePath}`,
      );
    } catch (error) {
      console.error(
        `[Hocuspocus] Error storing document ${documentId} to ${filePath}:`,
        error,
      );
    }
  },

  onConnect() {
    console.log("[Hocuspocus] Client connected (via Hocuspocus config).");
  },

  onDisconnect() {
    console.log("[Hocuspocus] Client disconnected (via Hocuspocus config).");
  },
};

// Signaling Server Logic
export let globalActiveDocumentId = "index"; // Export global state
export function setGlobalActiveDocumentId(id) {
  globalActiveDocumentId = id;
}

// Create a WebSocketServer instance, but don't start it listening on a port
// The 'noServer: true' option is crucial here, as it tells the wss not to create its own HTTP server.
export const signalingWss = new WebSocketServer({ noServer: true });

signalingWss.on("connection", (ws) => {
  console.log(
    `[Signaling] Client connected. Sending current active document ID: ${globalActiveDocumentId}`,
  );
  ws.send(
    JSON.stringify({
      type: "ACTIVE_DOCUMENT_ID",
      payload: globalActiveDocumentId,
    }),
  );

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "SET_ACTIVE_DOCUMENT_ID" && data.payload) {
        console.log(
          `[Signaling] Received request to set active document ID to: ${data.payload}`,
        );
        globalActiveDocumentId = data.payload;
        signalingWss.clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(
              JSON.stringify({
                type: "ACTIVE_DOCUMENT_ID",
                payload: globalActiveDocumentId,
              }),
            );
          }
        });
        console.log(
          `[Signaling] Broadcasted new active document ID: ${globalActiveDocumentId}`,
        );
      }
    } catch (error) {
      console.error(
        "[Signaling] Failed to parse message or invalid message format:",
        error,
      );
    }
  });

  ws.on("close", () => {
    console.log("[Signaling] Client disconnected.");
  });

  ws.on("error", (error) => {
    console.error("[Signaling] WebSocket error:", error);
  });
});
