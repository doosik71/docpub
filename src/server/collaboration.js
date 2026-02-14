import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import path from 'path'; // Import path
import fs from 'fs';     // Import fs
import { fileURLToPath } from 'url'; // Import fileURLToPath for ES Modules

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new Server({
  port: 1234, // Hocuspocus 서버 포트

  async onLoadDocument(data) {
    const documentId = data.documentName;
    const filePath = path.join(__dirname, `../../documents/${documentId}.bin`); // Change extension to .bin
    const ydoc = new Y.Doc();

    if (fs.existsSync(filePath)) {
      console.log(`Loading document: ${documentId} from ${filePath}`);
      const encodedState = fs.readFileSync(filePath);
      Y.applyUpdate(ydoc, encodedState); // Apply the loaded state to the Y.Doc
      console.log(`Loaded document state for ${documentId}`);
    } else {
      console.log(`Document not found, creating new: ${documentId}`);
    }

    return ydoc;
  },

  async onStoreDocument(data) {
    const documentId = data.documentName;
    const filePath = path.join(__dirname, `../../documents/${documentId}.bin`); // Change extension to .bin

    const encodedState = Y.encodeStateAsUpdate(data.document); // Get Yjs binary state
    fs.writeFileSync(filePath, Buffer.from(encodedState), 'binary'); // Write binary data
    console.log(`Storing document: ${documentId} to ${filePath}`);
  },

  onConnect() {
    console.log('Client connected.');
  },

  onDisconnect() {
    console.log('Client disconnected.');
  },
});

server.listen();
console.log('Hocuspocus server listening on port 1234');
