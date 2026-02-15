import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import path from 'path'; // Import path
import fs from 'fs';     // Import fs
import { fileURLToPath } from 'url'; // Import fileURLToPath for ES Modules
import express from 'express'; // Import express
import cors from 'cors'; // Import cors
import http from 'http'; // Import http

// ... existing imports ...
import { WebSocketServer } from 'ws'; // Import WebSocketServer for signaling

let globalActiveDocumentId = 'index'; // Global state for the active document ID

// WebSocket server for signaling global active document ID changes
const signalingPort = 1236;
const wss = new WebSocketServer({ port: signalingPort });

wss.on('connection', ws => {
  console.log(`[Signaling] Client connected. Sending current active document ID: ${globalActiveDocumentId}`);
  // Send current active document ID to newly connected client
  ws.send(JSON.stringify({ type: 'ACTIVE_DOCUMENT_ID', payload: globalActiveDocumentId }));

  ws.on('message', message => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'SET_ACTIVE_DOCUMENT_ID' && data.payload) {
        console.log(`[Signaling] Received request to set active document ID to: ${data.payload}`);
        globalActiveDocumentId = data.payload;
        // Broadcast the new active document ID to all connected clients
        wss.clients.forEach(client => {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({ type: 'ACTIVE_DOCUMENT_ID', payload: globalActiveDocumentId }));
          }
        });
        console.log(`[Signaling] Broadcasted new active document ID: ${globalActiveDocumentId}`);
      }
    } catch (error) {
      console.error('[Signaling] Failed to parse message or invalid message format:', error);
    }
  });

  ws.on('close', () => {
    console.log('[Signaling] Client disconnected.');
  });

  ws.on('error', error => {
    console.error('[Signaling] WebSocket error:', error);
  });
});

console.log(`Signaling server listening on port ${signalingPort}`);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ... rest of the file ...

const app = express(); // Create Express app
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from Next.js frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})); // Use CORS middleware
app.use(express.json()); // For parsing application/json

// Create a simple HTTP server for Express (moved here)
const httpServer = http.createServer(app);

const server = new Server({
  port: 1235, // Hocuspocus server will listen on its own port


  async onLoadDocument(data) {
    const documentId = data.documentName;
    const filePath = path.join(__dirname, `../../documents/${documentId}.bin`); // Change extension to .bin
    const ydoc = new Y.Doc();

    if (fs.existsSync(filePath)) {
      console.log(`Loading document: ${documentId} from ${filePath}`);
      const encodedState = fs.readFileSync(filePath);
              try {
                // Ensure encodedState is a Uint8Array (Buffer is a subclass, but explicit conversion might help)
                Y.applyUpdate(ydoc, new Uint8Array(encodedState));
              } catch (updateError) {
                console.error(`[Hocuspocus] Error applying Y.Doc update for ${documentId}.bin:`, updateError);
                console.error(`[Hocuspocus] Corrupted file content for ${documentId}.bin. Length: ${encodedState.length}`);
                // Attempt to log a small part of the content for inspection
                console.error(`[Hocuspocus] Corrupted content (first 50 bytes base64): ${encodedState.toString('base64').substring(0, 50)}`);
                // Do not throw error, return empty ydoc instead to allow connection
                return ydoc;
              }      console.log(`Loaded document state for ${documentId}`);
    } else {
      console.log(`Document not found, creating new: ${documentId}`);
    }

    return ydoc;
  },

  async onStoreDocument(data) {
    console.log(`[Hocuspocus] onStoreDocument called for document: ${data.documentName}`);
    const documentId = data.documentName;
    const filePath = path.join(__dirname, `../../documents/${documentId}.bin`); // Change extension to .bin

    try {
      const encodedState = Y.encodeStateAsUpdate(data.document); // Get Yjs binary state
      console.log(`[Hocuspocus] Storing document ${documentId}: encodedState size = ${encodedState.length} bytes.`); // Added log
      fs.writeFileSync(filePath, Buffer.from(encodedState)); // Write binary data
      console.log(`[Hocuspocus] Successfully stored document: ${documentId} to ${filePath}`);
    } catch (error) {
      console.error(`[Hocuspocus] Error storing document ${documentId} to ${filePath}:`, error);
    }
  },

  onConnect() {
    console.log('Client connected.');
  },

  onDisconnect() {
    console.log('Client disconnected.');
  },
});
/*
app.get('/api/documents', async (req, res) => {
  console.log('API: GET /api/documents endpoint hit.'); // Debug log
  const documentsDir = path.join(__dirname, '../../documents');
  console.log('API: Documents directory:', documentsDir); // Debug log
  try {
    const files = await fs.promises.readdir(documentsDir);
    console.log('API: Files found in documents directory:', files); // Debug log
    const documentMetadata = [];

    for (const file of files) {
      if (file.endsWith('.bin')) {
        const documentId = file.replace('.bin', '');
        const filePath = path.join(documentsDir, file);
        const encodedState = fs.readFileSync(filePath);

        const ydoc = new Y.Doc();
        try {
          Y.applyUpdate(ydoc, new Uint8Array(encodedState));
        } catch (updateError) {
          console.error(`[API - Express] Error applying Y.Doc update for ${documentId}.bin:`, updateError);
          console.error(`[API - Express] Corrupted file content for ${documentId}.bin. Length: ${encodedState.length}`);
          console.error(`[API - Express] Corrupted content (first 50 bytes base64): ${encodedState.toString('base64').substring(0, 50)}`);
          continue; // Skip this corrupted document and proceed to the next one
        }

        const metadata = ydoc.getMap('metadata').toJSON();
        console.log('API: Extracted metadata for', documentId, ':', metadata); // Debug log
        
        // Ensure metadata has all required fields, provide defaults if missing
        documentMetadata.push({
          id: documentId,
          title: metadata.title || 'Untitled Document',
          saved_at: metadata.saved_at || new Date(0).toISOString(), // Default to epoch
          saved_by: metadata.saved_by || 'Unknown',
        });
      }
    }
    console.log('API: All document metadata collected:', documentMetadata); // Debug log

    // Filter by title if query parameter is provided
    let filteredDocuments = documentMetadata;
    const { title } = req.query;
    if (title) {
      const lowerCaseTitle = title.toLowerCase();
      filteredDocuments = documentMetadata.filter(doc =>
        doc.title.toLowerCase().includes(lowerCaseTitle)
      );
      console.log('API: Filtered documents by title ("' + title + '"):', filteredDocuments); // Debug log
    }

    // Sort by saved_at (newest first)
    filteredDocuments.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
    console.log('API: Final documents to send:', filteredDocuments); // Debug log

    res.json(filteredDocuments);

  } catch (error) {
    console.error('API: Error fetching documents:', error); // Debug log
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Implement the API endpoint for deleting documents
app.delete('/api/documents/:id', async (req, res) => {
  console.log('API: DELETE /api/documents/:id endpoint hit.'); // Debug log
  const documentId = req.params.id;
  const filePath = path.join(__dirname, `../../documents/${documentId}.bin`);

  try {
    await fs.promises.unlink(filePath);
    console.log(`API: Document ${documentId}.bin deleted successfully.`); // Debug log
    res.status(200).json({ message: `Document ${documentId} deleted.` });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`API: Document ${documentId}.bin not found.`); // Debug log
      res.status(404).json({ error: `Document ${documentId} not found.` });
    } else {
      console.error(`API: Error deleting document ${documentId}:`, error); // Debug log
      res.status(500).json({ error: 'Failed to delete document.' });
    }
  }
});
*/
const PORT = process.env.PORT || 1234;

httpServer.listen(PORT, () => {
  console.log(`Express HTTP server listening on port ${PORT}`);
  // Hocuspocus server is already registered with the HTTP server via its constructor
  // server.listen(httpServer); // This call is redundant and causes an error
  console.log('Hocuspocus server registered with HTTP server.');
});

// Explicitly start the Hocuspocus server
server.listen();
console.log('Hocuspocus server listening on port', server.port);

