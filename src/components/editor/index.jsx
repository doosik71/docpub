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
import QuillCursors from "quill-cursors";
import { HocuspocusProvider } from "@hocuspocus/provider";
import "quill/dist/quill.snow.css";
import "katex/dist/katex.min.css"; // Import KaTeX CSS
import katex from "katex"; // Import katex
import "quill-katex"; // Import quill-katex

// Import table module components and CSS
import TableHandler, { rewirteFormats } from "quill1.3.7-table-module";
import "quill1.3.7-table-module/dist/index.css";

// Register table module
Quill.register("modules/cursors", QuillCursors);
Quill.register({ [`modules/${TableHandler.moduleName}`]: TableHandler }, true);
rewirteFormats(); // Rewrite native formats for table compatibility

window.katex = katex; // Make katex available to quill-katex globally

const QuillEditor = forwardRef(
  (
    {
      userName,
      editorRefProp,
      onMetadataUpdateProp,
      activeDocumentId,
      initialYDocState,
      onContentChangeProp, // Added this prop
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

    // Effect to initialize Quill instance once
    useEffect(() => {
      if (!quillContainerNode) {
        return; // Wait for the container to be rendered
      }

      // Clear the container before initializing a new Quill instance
      quillContainerNode.innerHTML = "";

      const quillInstance = new Quill(quillContainerNode, {
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
          cursors: true,
          formula: true,
          history: { userOnly: true },
          [TableHandler.moduleName]: {
            fullWidth: true,
            customButton: "Insert",
          },
        },
        placeholder: "Start writing...",
      });

      setQuill(quillInstance);

      return () => {
        setQuill(null);
        if (quillContainerNode) {
          quillContainerNode.innerHTML = "";
        }
      };
    }, [quillContainerNode]); // Only run when the container node changes

    // Effect to handle ql-table button click
    useEffect(() => {
      if (!quill) {
        return;
      }

      const qlTableButton = document.querySelector(".ql-table");
      const createSelectDiv = document.querySelector(
        "#quill-toolbar .create_select",
      );

      if (qlTableButton && createSelectDiv) {
        const toggleDisplay = () => {
          if (createSelectDiv.style.display === "inline") {
            createSelectDiv.style.display = "none";
          } else {
            createSelectDiv.style.display = "inline";
          }
        };

        qlTableButton.addEventListener("click", toggleDisplay);

        return () => {
          qlTableButton.removeEventListener("click", toggleDisplay);
        };
      }
    }, [quill]);

    // Effect to initialize Yjs and Hocuspocus provider
    useEffect(() => {
      if (!quill) {
        return; // Wait for Quill to be initialized
      }

      const docId = activeDocumentId || "index";
      const newYdoc = new Y.Doc();
      setYdoc(newYdoc);

      if (initialYDocState) {
        try {
          Y.applyUpdate(newYdoc, initialYDocState);
        } catch (e) {
          console.error("Failed to apply initial YDoc state:", e);
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
        if (onMetadataUpdateProp) {
          onMetadataUpdateProp({
            title: metadata.get("title"),
            saved_at: metadata.get("saved_at"),
          });
        }
      };
      metadata.observe(metadataObserver);
      metadataObserver();

      const newProvider = new HocuspocusProvider({
        url: "ws://localhost:3000/hocuspocus",
        name: docId,
        document: newYdoc,
      });
      setProvider(newProvider);

      const localUserColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      newProvider.awareness.setLocalStateField("user", {
        name: userName,
        color: localUserColor,
      });

      const yQuillModule = require("y-quill");
      const yQuillBinding = new yQuillModule.QuillBinding(
        newYdoc.getText("quill"),
        quill,
        newProvider.awareness,
      );

      return () => {
        metadata.unobserve(metadataObserver);
        yQuillBinding.destroy();
        newProvider.destroy();
        setYdoc(null);
        setProvider(null);
      };
    }, [
      quill,
      activeDocumentId,
      initialYDocState,
      onMetadataUpdateProp,
      userName,
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

    // Effect to update saved_at timestamp on content change and handle TOC IDs
    useEffect(() => {
      if (quill && ydoc && quillContainerNode) {
        const handler = (delta, oldDelta, source) => {
          if (source === "user") {
            const metadata = ydoc.getMap("metadata");
            metadata.set("saved_at", new Date().toISOString());
          }

          if (onContentChangeProp) {
            const currentContents = quill.getContents();
            onContentChangeProp(currentContents);
          }

          // Add IDs to heading elements for TOC scrolling
          const headingElements = quillContainerNode.querySelectorAll(
            "h1, h2, h3, h4, h5, h6",
          );
          const headingIdCounter = {};

          headingElements.forEach((headingEl) => {
            const text = headingEl.innerText.trim();
            if (text) {
              let baseId = text
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-^$/g, "");
              if (!baseId) {
                baseId = `heading-${Date.now()}`;
              }

              headingIdCounter[baseId] = (headingIdCounter[baseId] || 0) + 1;
              const id =
                headingIdCounter[baseId] > 1
                  ? `${baseId}-${headingIdCounter[baseId]}`
                  : baseId;
              headingEl.id = id;
            }
          });
        };
        quill.on("text-change", handler);
        return () => {
          quill.off("text-change", handler);
        };
      }
    }, [quill, ydoc, onContentChangeProp, quillContainerNode]);

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
        getQuill: () => quill,
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
          <button className="ql-code"></button>
          <button className="ql-code-block"></button>
          <button className="ql-link"></button>
          <button className="ql-image"></button>
          <button className="ql-video"></button>
          <button className="ql-formula"></button>
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
          <button className="ql-table"></button>
          {/* Custom Table button */}
          <button className="ql-clean"></button>
        </div>
        <div id="quill-container" ref={quillContainerCallbackRef}></div>
      </div>
    );
  },
);

QuillEditor.displayName = "QuillEditor";

export default QuillEditor;
