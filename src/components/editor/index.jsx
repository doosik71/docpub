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

// Import table module components and CSS
import TableHandler, { rewirteFormats } from "quill1.3.7-table-module";
import "quill1.3.7-table-module/dist/index.css";

// Register table module
Quill.register({ [`modules/${TableHandler.moduleName}`]: TableHandler }, true);
rewirteFormats(); // Rewrite native formats for table compatibility

const QuillEditor = forwardRef(
  (
    {
      userName,
      editorRefProp,
      onMetadataUpdateProp,
      activeDocumentId,
      initialYDocState,
    },
    ref,
  ) => {
    // Removed activeDocumentId, initialYDocStateProp
    const [quillContainerNode, setQuillContainerNode] = useState(null); // Use state to hold the container DOM node
    const [quill, setQuill] = useState(null);
    const [ydoc, setYdoc] = useState(null);
    const [provider, setProvider] = useState(null);

    // Callback ref for the Quill container div
    const quillContainerCallbackRef = useCallback((node) => {
      setQuillContainerNode(node); // Set the node directly to state
    }, []);

    // Function to initialize Quill and HocuspocusProvider
    const initializeQuillAndHocuspocus = useCallback(
      (onMetadataUpdate, docId, initialYDocState, quillContainerElement) => {
        // Added docId
        if (typeof window === "undefined" || !quillContainerElement) {
          // Use the passed element
          return;
        }

        const documentNameToUse = docId || "index"; // Use provided docId or default to 'index'

        const newYdoc = new Y.Doc();
        if (initialYDocState) {
          try {
            Y.applyUpdate(newYdoc, initialYDocState);
          } catch (e) {
            console.error(
              "[Editor Init] Failed to apply initialYDocState:",
              e,
            );
          }
        }

        const metadata = newYdoc.getMap("metadata");
        if (!metadata.get("title")) {
          metadata.set("title", "DocPub");
        }
        if (!metadata.get("saved_at")) {
          metadata.set("saved_at", new Date().toISOString());
        }

        const metadataObserver = () => {
          if (onMetadataUpdate) {
            onMetadataUpdate({
              title: metadata.get("title"),
              saved_at: metadata.get("saved_at"),
            });
          }
        };
        metadata.observe(metadataObserver);
        metadataObserver();

        const newProvider = new HocuspocusProvider({
          url: "ws://127.0.0.1:1235",
          name: documentNameToUse,
          document: newYdoc,
        });

        const localUserColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        newProvider.awareness.setLocalStateField("user", {
          name: userName,
          color: localUserColor,
        });

        if (!quillContainerElement) {
          return;
        }

        const quillInstance = new Quill(quillContainerElement, {
          theme: "snow",
          modules: {
            toolbar: {
              container: "#quill-toolbar",
              handlers: {
                caption: function (value) {
                  const quill = this.quill;
                  const range = quill.getSelection(true);
                  if (range) {
                    quill.format("bold", !quill.getFormat(range)["bold"]);
                    quill.format(
                      "align",
                      quill.getFormat(range)["align"] === "center"
                        ? false
                        : "center",
                    );
                  }
                },
              },
            },
            history: { userOnly: true },
            [TableHandler.moduleName]: {
              fullWidth: true,
              customButton: "Insert",
            },
          },
          placeholder: "Start writing...",
        });

        const yQuillModule = require("y-quill");
        const yQuillBinding = new yQuillModule.QuillBinding(
          newYdoc.getText("quill"),
          quillInstance,
          newProvider.awareness,
        );

        setYdoc(newYdoc);
        setProvider(newProvider);
        setQuill(quillInstance);

        return () => {
          metadata.unobserve(metadataObserver);
          yQuillBinding.destroy();
          newProvider.destroy();
          setYdoc(null);
          setProvider(null);
          setQuill(null);
        };
      },
      [userName, onMetadataUpdateProp],
    );

    // Initial load and cleanup
    useEffect(() => {
      if (!quillContainerNode) {
        return;
      }
      const cleanup = initializeQuillAndHocuspocus(
        onMetadataUpdateProp,
        activeDocumentId,
        initialYDocState,
        quillContainerNode,
      );

      return () => {
        if (cleanup) {
          cleanup();
        }
      };
    }, [
      quillContainerNode,
      activeDocumentId,
      initialYDocState,
      onMetadataUpdateProp,
      initializeQuillAndHocuspocus,
    ]);

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
          if (source === "user") {
            const metadata = ydoc.getMap("metadata");
            metadata.set("saved_at", new Date().toISOString());
          }
        };
        quill.on("text-change", handler);
        return () => {
          quill.off("text-change", handler);
        };
      }
    }, [quill, ydoc]);

    // Expose methods and states to parent component
    useImperativeHandle(
      editorRefProp,
      () => ({
        handlePrint: () => {
          if (typeof window !== "undefined") {
            window.print();
          }
        },
        getYdoc: () => ydoc,
        getContents: () => quill?.getContents(),
        setContents: (delta) => quill?.setContents(delta),
        getDocumentTitle: () => ydoc?.getMap("metadata").get("title"),
        setDocumentTitle: (newTitle) => {
          if (ydoc) {
            ydoc.getMap("metadata").set("title", newTitle);
          }
        },
        getBinaryYDocState: () => {
          if (ydoc) {
            return Y.encodeStateAsUpdate(ydoc);
          }
          return null;
        },
        applyYDocUpdate: (binaryState) => {
          if (ydoc && binaryState) {
            Y.applyUpdate(ydoc, binaryState);
          }
        },
      }),
      [quill, ydoc],
    );

    return (
      <div id="quill-editor-component">
        {/* Toolbar div */}
        <div id="quill-toolbar">
          <select className="ql-header">
            <option value="1"></option>
            <option value="2"></option>
            <option value="3"></option>
            <option value="4"></option>
            <option value=""></option>
          </select>
          <select className="ql-color"></select>
          <select className="ql-background"></select>
          <button className="ql-bold"></button>
          <button className="ql-italic"></button>
          <button className="ql-underline"></button>
          <select className="ql-align">
            <option value=""></option>
            <option value="center"></option>
            <option value="right"></option>
            <option value="justify"></option>
          </select>
          <button className="ql-list" value="ordered"></button>
          <button className="ql-list" value="bullet"></button>
          <button className="ql-blockquote"></button>
          <button className="ql-code-block"></button>
          <button className="ql-link"></button>
          <button className="ql-image"></button>
          <button className="ql-video"></button>
          <button className="ql-caption">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ql-stroke"
            >
              <rect x="3" y="4" width="18" height="13" rx="2" ry="2" />
              <path d="M9.5 9.2c-1.4 0-2.3 1-2.3 2.3s.9 2.3 2.3 2.3c.6 0 1.1-.2 1.6-.6" />
              <path d="M15.3 9.2c-1.4 0-2.3 1-2.3 2.3s.9 2.3 2.3 2.3c.6 0 1.1-.2 1.6-.6" />
              <path d="M7 20h10" />
            </svg>
          </button>
          {/* <button className="ql-table">Table</button> */}
          {/* Custom Table button */}
          <button className="ql-clean"></button>
        </div>
        <div
          id="quill-container"
          ref={quillContainerCallbackRef}
        ></div>
      </div>
    );
  },
);

QuillEditor.displayName = "QuillEditor";

export default QuillEditor;
