"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Quill from "quill";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import "quill/dist/quill.snow.css";
// Removed imports for quill-better-table (and its CSS)
// Removed imports for quill-delta-to-markdown

const QuillEditor = () => {
  const [quillContainer, setQuillContainer] = useState(null);
  const quillToolbarRef = useRef(null);
  const [quill, setQuill] = useState(null);
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);

  const quillContainerCallbackRef = useCallback((node) => {
    if (node !== null) {
      setQuillContainer(node);
    }
  }, []);

  useEffect(() => {
    let quillInstance;
    let newYdoc;
    let newProvider;
    let yQuillBinding;
    const remoteCursorElements = new Map(); // Map to store remote cursor DOM elements

    if (typeof window !== "undefined" && quillContainer && !quill) {
      newYdoc = new Y.Doc();
      newProvider = new HocuspocusProvider({
        url: "ws://127.0.0.1:1234",
        name: "test-document",
        document: newYdoc,
      });

      const localUserName = `User ${Math.floor(Math.random() * 1000)}`;
      const localUserColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

      newProvider.awareness.setLocalStateField("user", {
        name: localUserName,
        color: localUserColor,
      });

      // Listen to awareness updates
      newProvider.awareness.on("update", (update, origin) => {
        const states = newProvider.awareness.getStates();
        const activeClientIDs = new Set();

        states.forEach((state, clientID) => {
          activeClientIDs.add(clientID);

          if (clientID !== newProvider.document.clientID && state.user && state.cursor) {
            let cursorElement = remoteCursorElements.get(clientID);
            const bounds = quillInstance.getBounds(state.cursor.anchor);

            if (!cursorElement) {
              cursorElement = document.createElement('div');
              cursorElement.className = 'remote-cursor-indicator';
              cursorElement.style.position = 'absolute';
              cursorElement.style.width = '2px';
              cursorElement.style.backgroundColor = state.user.color;
              cursorElement.style.zIndex = '9999';
              cursorElement.style.pointerEvents = 'none';

              const nameTag = document.createElement('div');
              nameTag.className = 'remote-cursor-name-tag';
              nameTag.style.position = 'absolute';
              nameTag.style.whiteSpace = 'nowrap';
              nameTag.style.fontSize = '10px';
              nameTag.style.padding = '2px 4px';
              nameTag.style.borderRadius = '3px';
              nameTag.style.backgroundColor = state.user.color;
              nameTag.style.color = 'white';
              nameTag.style.left = '-2px';
              nameTag.style.top = '-12px';
              nameTag.textContent = state.user.name;

              cursorElement.appendChild(nameTag);
              quillInstance.root.appendChild(cursorElement);
              remoteCursorElements.set(clientID, cursorElement);
            }

            cursorElement.style.left = `${bounds.left}px`;
            cursorElement.style.top = `${bounds.top}px`;
            cursorElement.style.height = `${bounds.height}px`;

          } else if (clientID !== newProvider.document.clientID && !state.cursor) {
            const existingCursor = remoteCursorElements.get(clientID);
            if (existingCursor) {
              existingCursor.remove();
              remoteCursorElements.delete(clientID);
            }
          }
        });

        remoteCursorElements.forEach((element, clientID) => {
          if (!activeClientIDs.has(clientID) || !states.get(clientID).cursor) {
            element.remove();
            remoteCursorElements.delete(clientID);
          }
        });
      });


      quillInstance = new Quill(quillContainer, {
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

      // Listen to Quill's selection-change event to update local cursor position
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
      remoteCursorElements.forEach(element => element.remove());
      remoteCursorElements.clear();
    };
  }, [quillContainer]);

  if (!quill) { // Reinstated loading state
    return null;
  }

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
