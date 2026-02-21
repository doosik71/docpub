// server.js
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws"; // Re-import WebSocketServer for hocuspocusWss
import { Hocuspocus } from "@hocuspocus/server"; // Re-import Hocuspocus

// Import the exported configurations and setter
import {
  hocuspocusConfiguration,
  signalingWss,
} from "./src/server/collaboration-exports.js";

console.log('Server Process ID:', process.pid); // ADDED FOR DIAGNOSIS

// Instantiate Hocuspocus Server
const hocuspocusInstance = new Hocuspocus(hocuspocusConfiguration);
// Create a WebSocketServer specifically for Hocuspocus to handle upgrades
const hocuspocusWss = new WebSocketServer({ noServer: true });

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  server.on("upgrade", (req, socket, head) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (pathname === "/signaling") {
      signalingWss.handleUpgrade(req, socket, head, (ws) => {
        signalingWss.emit("connection", ws, req);
      });
    } else if (pathname === "/hocuspocus") {
      hocuspocusWss.handleUpgrade(req, socket, head, (ws) => { // Correctly using hocuspocusWss
        hocuspocusInstance.handleConnection(ws, req); // Pass to Hocuspocus instance
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(
      `Hocuspocus server listening on ws://${hostname}:${port}/hocuspocus`,
    );
    console.log(
      `Signaling server listening on ws://${hostname}:${port}/signaling`,
    );
  });
});