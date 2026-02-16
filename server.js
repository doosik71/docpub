// server.js
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws"; // For signaling
import { Hocuspocus } from "@hocuspocus/server"; // For Hocuspocus

// Import the exported configurations
import {
  hocuspocusConfiguration,
  signalingWss,
} from "./src/server/collaboration-exports.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // Handle Next.js pages
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Signaling WebSocketServer (imported from collaboration-exports.js)
  const hocuspocusInstance = new Hocuspocus(hocuspocusConfiguration);
  const hocuspocusWss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    // Use WHATWG URL API instead of deprecated url.parse()
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (pathname === "/signaling") {
      signalingWss.handleUpgrade(req, socket, head, (ws) => {
        signalingWss.emit("connection", ws, req);
      });
    } else if (pathname === "/hocuspocus") {
      hocuspocusWss.handleUpgrade(req, socket, head, (ws) => {
        hocuspocusInstance.handleConnection(ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  // Hocuspocus is now bound to the main HTTP server via the 'server' option in its constructor.
  // No explicit hocuspocus.listen() call is needed here.

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
