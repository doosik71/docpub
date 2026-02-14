"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Quill from "quill";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import "quill/dist/quill.snow.css";

const QuillEditor = () => {
  console.log("QuillEditor rendering..."); // Debug: Confirm component is rendering

  const [quillContainer, setQuillContainer] = useState(null);
  const quillToolbarRef = useRef(null);
  const [quill, setQuill] = useState(null);
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);

  const quillContainerCallbackRef = useCallback((node) => {
    console.log("Callback ref fired. node:", node); // Debug: Confirm ref callback invocation
    if (node !== null) {
      setQuillContainer(node);
    }
  }, []);

  useEffect(() => {
    let quillInstance;
    let newYdoc;
    let newProvider;
    let yQuillBinding;
    const remoteCursorElements = new Map();

    console.log("useEffect running. quillContainer:", quillContainer); // Debug

    if (typeof window !== "undefined" && quillContainer && !quill) {
      console.log("Initializing Quill on container:", quillContainer); // Debug

      newYdoc = new Y.Doc();
      console.log("Y.Doc created:", newYdoc); // Debug
      newProvider = new HocuspocusProvider({
        url: "ws://127.0.0.1:1234",
        name: "test-document",
        document: newYdoc,
      });
      console.log("HocuspocusProvider created:", newProvider); // Debug

      const localUserName = `User ${Math.floor(Math.random() * 1000)}`;
      const localUserColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

      newProvider.awareness.setLocalStateField("user", {
        name: localUserName,
        color: localUserColor,
      });

      newProvider.awareness.on("update", (update, origin) => {
        console.log('Awareness update received:', { update, origin }); // Debug
        const states = newProvider.awareness.getStates();
        const activeClientIDs = new Set();

        states.forEach((state, clientID) => {
          activeClientIDs.add(clientID);

          if (clientID !== newProvider.document.clientID && state.user && state.cursor) {
            // Re-added remote cursor logging for debugging purposes
            console.log(`Remote user ${state.user.name} (ID: ${clientID}) at cursor:`, state.cursor);
          }
        });
        // No visual cursor implementation, just logging
      });


      quillInstance = new Quill(quillContainer, {
        theme: "snow",
        modules: {
          toolbar: {
            container: quillToolbarRef.current,
            // Removed Markdown handler
            // Removed image handler
          },
          history: {
            userOnly: true,
          },
        },
        placeholder: "Start writing...",
      });
      console.log("Quill instance created:", quillInstance); // Debug

      quillInstance.on("selection-change", (range, oldRange, source) => {
        if (range && source === "user") {
          newProvider.awareness.setLocalStateField("cursor", {
            anchor: range.index,
            head: range.index + range.length,
          });
        } else {
          newProvider.awareness.setLocalStateField("cursor", null); // Clear cursor if no selection
        }
      });

      const yQuillModule = require("y-quill");
      yQuillBinding = new yQuillModule.QuillBinding(
        newYdoc.getText("quill"),
        quillInstance,
      );
      console.log("Quill binding created:", yQuillBinding); // Debug

      setYdoc(newYdoc);
      setProvider(newProvider);
      setQuill(quillInstance);
    }

    return () => {
      if (quillInstance) {
        quillInstance = null;
      }
      if (yQuillBinding) {
        yQuillBinding.destroy();
      }
      if (newProvider) {
        newProvider.destroy();
      }
      // remoteCursorElements.forEach(element => element.remove()); // Re-added remote cursor cleanup for debugging
      // remoteCursorElements.clear(); // Re-added remote cursor cleanup for debugging
    };
  }, [quillContainer]);

  // if (!quill) { // Removed loading state to force rendering
  //   return null;
  // }

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
      </div>
      {/* Editor content area */}
      <div
        id="quill-container"
        ref={quillContainerCallbackRef}
        className="h-full"
      ></div>
    </div>
  );
};

export default QuillEditor;
