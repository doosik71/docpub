import {
  useEffect,
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import Quill from "quill";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import "quill/dist/quill.snow.css";
import "@/core/quill-caption"; // Import to register the blot

const QuillEditor = forwardRef(
  ({ userName, editorRefProp, onMetadataUpdateProp, activeDocumentId, initialYDocState }) => {
    // Removed activeDocumentId, initialYDocStateProp
    const quillContainerRef = useRef(null); // Use a ref for the container div
    const quillToolbarRef = useRef(null);
    const [quill, setQuill] = useState(null);
    const [ydoc, setYdoc] = useState(null);
    const [provider, setProvider] = useState(null);

    // Callback ref for the Quill container div
    const quillContainerCallbackRef = useCallback((node) => {
      if (node !== null) {
        quillContainerRef.current = node;
      }
    }, []);

    // Function to initialize Quill and HocuspocusProvider
    const initializeQuillAndHocuspocus = useCallback(
      (onMetadataUpdate, docId, initialYDocState) => {
        // Added docId
        if (typeof window === "undefined" || !quillContainerRef.current) {
          return;
        }

        // Clear the container before initializing a new Quill instance
        quillContainerRef.current.innerHTML = "";

        const documentNameToUse = docId || "index"; // Use provided docId or default to 'index'
        console.log("Initializing Quill for document:", documentNameToUse);

        const newYdoc = new Y.Doc();
        if (initialYDocState) {
          Y.applyUpdate(newYdoc, initialYDocState);
          console.log("[QuillEditor] Applied initialYDocState to newYdoc.");
        }
        // initialYDocState is no longer used here; applyYDocUpdate will be used after load.

        const metadata = newYdoc.getMap("metadata");
        // Initialize metadata with defaults if not present
        if (!metadata.get("title")) {
          metadata.set("title", "DocPub"); // Set default title if not already present
        }
        if (!metadata.get("saved_at")) {
          // Only set saved_at if it's truly a new document without existing timestamp
          metadata.set("saved_at", new Date().toISOString());
        }

        // Observe metadata changes and trigger callback
        const metadataObserver = () => {
          if (onMetadataUpdate) {
            onMetadataUpdate({
              title: metadata.get("title"),
              saved_at: metadata.get("saved_at"),
            });
          }
        };
        metadata.observe(metadataObserver);
        metadataObserver(); // Manually trigger once to set initial title in parent

        const newProvider = new HocuspocusProvider({
          url: "ws://127.0.0.1:1235",
          name: documentNameToUse, // Use documentNameToUse here
          document: newYdoc,
          // Add connection status logging
          onStatus: ({ status }) => {
            console.log(`[HocuspocusProvider] Connection status: ${status}`);
          },
          onOpen: () => {
            console.log("[HocuspocusProvider] Connection opened.");
          },
          onClose: () => {
            console.log("[HocuspocusProvider] Connection closed.");
          },
          onDestroy: () => {
            console.log("[HocuspocusProvider] Connection destroyed.");
          },
        });

        newProvider.on('synced', isSynced => {
          console.log(`[HocuspocusProvider] Document ${documentNameToUse} synced: ${isSynced}`);
        });

        const localUserColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

        newProvider.awareness.setLocalStateField("user", {
          name: userName,
          color: localUserColor,
        });

        newProvider.awareness.on("update", (update, origin) => {
          const states = newProvider.awareness.getStates();
          states.forEach((state, clientID) => {
            if (
              clientID !== newProvider.document.clientID &&
              state.user &&
              state.cursor
            ) {
              // console.log(`Remote user ${state.user.name} (ID: ${clientID}) at cursor:`, state.cursor);
            }
          });
        });

        const quillInstance = new Quill(quillContainerRef.current, {
          theme: "snow",
          modules: {
            toolbar: {
              container: quillToolbarRef.current,
            },
            history: {
              userOnly: true,
            },
          },
          placeholder: "Start writing...",
        });

        const yQuillModule = require("y-quill");
        const yQuillBinding = new yQuillModule.QuillBinding(
          newYdoc.getText("quill"),
          quillInstance,
          newProvider.awareness, // Pass awareness for cursors
        );

        setYdoc(newYdoc);
        setProvider(newProvider);
        setQuill(quillInstance);

        return () => {
          console.log(
            "Cleaning up Hocuspocus and Quill for document:",
            documentNameToUse,
          );
          metadata.unobserve(metadataObserver); // Cleanup metadata observer
          yQuillBinding.destroy();
          newProvider.destroy();
          // quillInstance.destroy(); // Destroy Quill instance to prevent memory leaks - NOT A FUNCTION
          setYdoc(null);
          setProvider(null);
          setQuill(null);
          // setCurrentDocumentName(null); // No longer needed as currentDocumentName state is removed
        };
      },
      [userName, quillContainerRef, onMetadataUpdateProp, activeDocumentId],
    ); // Add activeDocumentId to dependencies

    // Initial load and cleanup
    useEffect(() => {
      const cleanup = initializeQuillAndHocuspocus(
        onMetadataUpdateProp,
        activeDocumentId,
        initialYDocState, // Pass initialYDocState
      );
      return cleanup;
    }, [initializeQuillAndHocuspocus, onMetadataUpdateProp, activeDocumentId, initialYDocState]);

    // Effect to update awareness when userName changes
    useEffect(() => {
      if (provider && userName) {
        provider.awareness.setLocalStateField("user", {
          name: userName,
          color:
            provider.awareness.getLocalState()?.user?.color ||
            `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        });
      }
    }, [userName, provider]);

    // Effect to update saved_at timestamp on content change
    useEffect(() => {
      if (quill && ydoc) {
        const handler = (delta, oldDelta, source) => {
          // Only update if change was from user interaction
          if (source === "user") {
            const metadata = ydoc.getMap("metadata");
            metadata.set("saved_at", new Date().toISOString());
            // console.log(
            //   "[QuillEditor] Metadata updated: saved_at",
            //   metadata.get("saved_at"),
            // );
          }
        };
        quill.on("text-change", handler);
        return () => {
          quill.off("text-change", handler);
        };
      }
    }, [quill, ydoc]);

    // Expose methods and states to parent component
    useImperativeHandle(editorRefProp, () => {
      // Use editorRefProp here
      const exposed = {
        handlePrint: () => {
          if (typeof window !== "undefined") {
            window.print();
          }
        },
        getYdoc: () => ydoc, // Expose ydoc
        // Removed currentDocumentName and loadDocument as document loading is now driven by activeDocumentId prop
        getContents: () => quill?.getContents(), // Expose getContents
        setContents: (delta) => quill?.setContents(delta), // Expose setContents
        getDocumentTitle: () => ydoc?.getMap("metadata").get("title"), // Expose document title from metadata
        setDocumentTitle: (newTitle) => {
          if (ydoc) {
            ydoc.getMap("metadata").set("title", newTitle);
            console.log("[QuillEditor] Document title set to:", newTitle);
          }
        },
        getBinaryYDocState: () => {
          // New method to get Y.Doc's binary state
          if (ydoc) {
            return Y.encodeStateAsUpdate(ydoc);
          }
          return null;
        },
        applyYDocUpdate: (binaryState) => {
          // New method to apply binary state to Y.Doc
          if (ydoc && binaryState) {
            Y.applyUpdate(ydoc, binaryState);
            console.log("[QuillEditor] Applied Y.Doc binary update.");
          }
        },
      };
      // console.log("QuillEditor: useImperativeHandle exposing:", exposed); // ADD THIS LINE
      return exposed;
    });
    return (
      <div id="quill-editor-component" className="flex flex-col h-full">
        {/* Toolbar div */}
        <div id="quill-toolbar" ref={quillToolbarRef}>
          <button className="ql-bold"></button>
          <button className="ql-italic"></button>
          <button className="ql-underline"></button>
          <select className="ql-header">
            <option value="1"></option>
            <option value="2"></option>
            <option value="3"></option>
            <option value="4"></option>
            <option value=""></option>
          </select>
          <button className="ql-list" value="ordered"></button>
          <button className="ql-list" value="bullet"></button>
          <button className="ql-blockquote"></button>
          <button className="ql-code-block"></button>
          <button className="ql-link"></button>
          <button className="ql-image"></button>
          <button className="ql-caption">🈪</button>{" "}
          {/* Added Caption button */}
        </div>
        {/* Editor content area */}
        <div
          id="quill-container"
          ref={quillContainerCallbackRef}
          className="h-full"
        ></div>
      </div>
    );
  },
);

export default QuillEditor;
