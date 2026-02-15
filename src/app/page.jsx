"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect, useRef, useCallback } from "react";
import MenuPopup from "../components/menu-popup";
import DocumentListPopup from "../components/document-list-popup"; // Import DocumentListPopup
import { themes } from "../lib/themes"; // Import themes
import { v4 as uuidv4 } from "uuid"; // Import uuid

const DynamicQuillEditor = dynamic(
  () => import("../components/editor/index.jsx"),
  { ssr: false },
);

export default function Home() {
  const baseDocId = "index"; // All clients collaborate on this fixed document ID
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDocumentListOpen, setIsDocumentListOpen] = useState(false); // New state for document list popup
  const [userName, setUserName] = useState("Guest"); // Default user name
  const [theme, setTheme] = useState("light"); // Default theme ID
  const [documentTitle, setDocumentTitle] = useState("DocPub"); // New state for document title
  const [isEditingTitle, setIsEditingTitle] = useState(false); // State to control title editing mode
  const [saveMessage, setSaveMessage] = useState(null); // New state for save message
  const titleInputRef = useRef(null); // Ref for the title input field
  const editorRef = useRef(null); // Ref for the QuillEditor

  // Callback to receive metadata updates from QuillEditor
  const handleMetadataUpdate = useCallback((metadata) => {
    // console.log("[Page] Received metadata update:", metadata); // Debug log
    if (metadata.title) {
      setDocumentTitle(metadata.title);
    } else {
      setDocumentTitle("DocPub"); // Fallback
    }
    // You could also update saved_at display here if needed
  }, []); // Empty dependency array as setCurrentDocTitle is stable

  // Effect to apply theme CSS variables to html element
  useEffect(() => {
    const selectedTheme = themes.find((t) => t.id === theme);
    if (selectedTheme) {
      for (const [key, value] of Object.entries(selectedTheme.colors)) {
        document.documentElement.style.setProperty(key, value);
      }
    }
  }, [theme]);

  // Effect to focus the input field when editing mode is enabled
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  // Effect to manage save message visibility
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage(null);
      }, 3000); // Message disappears after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // Handle Ctrl+S for saving document and Ctrl+O for opening document list
  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault(); // Prevent browser save dialog
        console.log("Ctrl+S detected. Attempting to save..."); // Debug log

        if (editorRef.current) {
          const ydoc = editorRef.current.getYdoc();
          if (!ydoc) {
            console.error("Y.Doc not initialized for save.");
            return;
          }

          // Update saved_at/saved_by metadata on the current Y.Doc (baseDocId)
          const metadata = ydoc.getMap("metadata");
          metadata.set("saved_at", new Date().toISOString());
          metadata.set("saved_by", userName);

          // Get the binary state of the current Y.Doc (baseDocId)
          const binaryState = editorRef.current.getBinaryYDocState();
          // No need to get title separately, it's part of the binary state
          console.log(
            "[Page] Captured binary Y.Doc state (length):",
            binaryState ? binaryState.length : "null",
          );
          // console.log(
          //   "[Page] Captured binary Y.Doc state (base64 start):",
          //   binaryState
          //     ? binaryState.toString("base64").substring(0, 50) + "..."
          //     : "null",
          // );

          try {
            // Send the Y.Doc state to the new API endpoint to save it as a new document
            const response = await fetch("/api/documents", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                state: binaryState.toString("base64"), // Send binary state as base64 string
                // No 'id' is passed, so the API will generate a new UUID
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(
              `[Page] Document saved to server with ID: ${result.id}`,
            );
            setSaveMessage(`Document saved successfully with ID: ${result.id}`);

            // After saving, reload the base document ('current') to clear initialYDocState
            // This is not strictly needed here as we aren't changing active document.
            // The editor remains connected to 'current', and this save just creates a new persisted copy.
          } catch (error) {
            console.error("[Page] Error saving document:", error);
            setSaveMessage("Failed to save document!");
          }
        } else {
          console.warn("editorRef.current is not available yet for Ctrl+S.");
        }
      } else if (event.ctrlKey && event.key === "o") {
        event.preventDefault(); // Prevent browser open dialog
        setIsDocumentListOpen(true);
        console.log("Ctrl+O detected. Opening document list."); // Debug log
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    editorRef.current,
    documentTitle,
    userName,
    setIsDocumentListOpen,
    setSaveMessage,
  ]); // NEW DEPENDENCIES

  const handleNewDocument = () => {
    if (editorRef.current) {
      editorRef.current.setContents([]); // Clear editor content
      editorRef.current.setDocumentTitle("Untitled Document"); // Set a default new title
      setDocumentTitle("Untitled Document"); // Update local state
    }
    setSaveMessage("New document created.");
  };

  const handleOpenDocument = () => {
    setIsDocumentListOpen(true);
  };

  const handleSaveDocument = async () => {
    console.log("Save button clicked. Attempting to save...");
    if (editorRef.current) {
      const ydoc = editorRef.current.getYdoc();
      if (!ydoc) {
        console.error("Y.Doc not initialized for save.");
        return;
      }

      const metadata = ydoc.getMap("metadata");
      metadata.set("saved_at", new Date().toISOString());
      metadata.set("saved_by", userName);

      const binaryState = editorRef.current.getBinaryYDocState();

      try {
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state: binaryState.toString("base64"),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(`[Page] Document saved to server with ID: ${result.id}`);
        setSaveMessage(`Document saved successfully with ID: ${result.id}`);
      } catch (error) {
        console.error("[Page] Error saving document:", error);
        setSaveMessage("Failed to save document!");
      }
    } else {
      console.warn("editorRef.current is not available yet for saving.");
    }
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleDocumentListClose = () => {
    setIsDocumentListOpen(false);
  };

  const handleLoadDocument = async (documentId) => {
    // Added async
    handleDocumentListClose(); // Close list first

    try {
      // Fetch binary state from the new API endpoint
      const response = await fetch(`/api/documents?id=${documentId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json(); // Data contains { id, state }
      const binaryState = Buffer.from(data.state, "base64"); // Decode base64 to binary

      if (editorRef.current) {
        // Apply the loaded state to the base document '0'
        editorRef.current.applyYDocUpdate(binaryState);
        console.log(`[Page] Loaded document ${documentId} into base document.`);
      } else {
        console.warn(
          "[Page] editorRef.current is not available for applying Y.Doc update.",
        );
      }
    } catch (error) {
      console.error(`[Page] Error loading document ${documentId}:`, error);
      setSaveMessage(`Failed to load document: ${documentId}`); // Display error to user
    }
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (event) => {
    const newTitle = event.target.value;
    setDocumentTitle(newTitle); // Optimistic update for local UI
    // Propagate title change to Y.Doc for collaboration
    if (editorRef.current && editorRef.current.setDocumentTitle) {
      editorRef.current.setDocumentTitle(newTitle);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (documentTitle.trim() === "") {
      setDocumentTitle("DocPub"); // Revert to default if title is empty
    }
  };

  const handleTitleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent new line in input
      setIsEditingTitle(false);
      if (documentTitle.trim() === "") {
        setDocumentTitle("DocPub"); // Revert to default if title is empty
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-4 px-4">
      <div className="w-full max-w-[794px] flex justify-between items-center">
        {isEditingTitle ? (
          <input
            id="title-input"
            ref={titleInputRef}
            type="text"
            className="text-4xl font-bold bg-transparent border-b-2 border-blue-500 outline-none"
            value={documentTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            aria-label="Document Title"
          />
        ) : (
          <h1
            className="text-4xl font-bold cursor-pointer"
            onClick={handleTitleClick}
          >
            {documentTitle}
          </h1>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleNewDocument}
            className="p-2 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-label="New Document"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            onClick={handleOpenDocument}
            className="p-2 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-label="Open Document"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"
              />
            </svg>
          </button>
          <button
            onClick={handleSaveDocument}
            className="p-2 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-label="Save Document"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          </button>
          <button
            id="menu-button"
            onClick={handleMenuToggle}
            className="p-2 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Reduced bottom margin */}
      <div
        id="editor-wrapper-page"
        className="w-full max-w-[794px] rounded-lg flex flex-col h-[calc(100vh-6rem)]" // Re-added fixed height
      >
        {" "}
        {/* Removed fixed height constraint */}
        <DynamicQuillEditor
          editorRefProp={editorRef}
          userName={userName}
          onMetadataUpdateProp={handleMetadataUpdate}
          activeDocumentId={baseDocId} // Always collaborate on the fixed base document ID '0'
          // initialYDocStateProp is no longer needed in this context
        />
      </div>
      {/* {console.log(
        "page.jsx: After DynamicQuillEditor render, editorRef.current:",
        editorRef.current,
      )} */}
      <MenuPopup
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        userName={userName}
        setUserName={setUserName}
        theme={theme}
        setTheme={setTheme}
      />
      <DocumentListPopup
        isOpen={isDocumentListOpen}
        onClose={handleDocumentListClose}
        onLoadDocument={handleLoadDocument}
      />

      {saveMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {saveMessage}
        </div>
      )}
    </main>
  );
}
