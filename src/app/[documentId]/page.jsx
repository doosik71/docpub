"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect, useRef, useCallback } from "react";
import MenuPopup from "../../components/menu-popup";
import DocumentListPopup from "../../components/document-list-popup";
import SearchDocumentPopup from "../../components/search-document-popup";
import NewDocumentPopup from "../../components/new-document-popup";
import { themes } from "../../lib/themes";
import { useRouter } from "next/navigation";

const DynamicQuillEditor = dynamic(
  () => import("../../components/editor/index.jsx"),
  { ssr: false },
);

export default function DocumentPage({ params }) {
  const router = useRouter();
  const { documentId: paramDocumentId } = params;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDocumentListOpen, setIsDocumentListOpen] = useState(false);
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const [isNewDocumentPopupOpen, setIsNewDocumentPopupOpen] = useState(false);
  const [userName, setUserName] = useState("Guest");
  const [theme, setTheme] = useState("light");
  const [documentTitle, setDocumentTitle] = useState("DocPub");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const titleInputRef = useRef(null);
  const editorRef = useRef(null);
  const [initialEditorYDocState, setInitialEditorYDocState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleMetadataUpdate = useCallback((metadata) => {
    if (metadata.title) {
      setDocumentTitle(metadata.title);
    } else {
      setDocumentTitle("DocPub");
    }
  }, []);

  useEffect(() => {
    const selectedTheme = themes.find((t) => t.id === theme);
    if (selectedTheme) {
      for (const [key, value] of Object.entries(selectedTheme.colors)) {
        document.documentElement.style.setProperty(key, value);
      }
    }
  }, [theme]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  useEffect(() => {
    document.title = documentTitle ? documentTitle : "DocPub";
  }, [documentTitle]);

  useEffect(() => {
    const fetchDocumentState = async () => {
      if (!paramDocumentId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        const response = await fetch(`/api/documents?id=${paramDocumentId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setSaveMessage(`Starting new document: ${paramDocumentId}`);
            setInitialEditorYDocState(null);
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          const data = await response.json();
          setInitialEditorYDocState(Buffer.from(data.state, "base64"));
          setSaveMessage(`Document ${paramDocumentId} loaded.`);
        }
      } catch (error) {
        console.error(`Error fetching document ${paramDocumentId}:`, error);
        setSaveMessage(`Failed to load document: ${paramDocumentId}`);
        setInitialEditorYDocState(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentState();
  }, [paramDocumentId]);

  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        if (editorRef.current) {
          const ydoc = editorRef.current.getYdoc();
          if (!ydoc) return;

          const metadata = ydoc.getMap("metadata");
          metadata.set("saved_at", new Date().toISOString());
          metadata.set("saved_by", userName);

          const binaryState = editorRef.current.getBinaryYDocState();

          try {
            const response = await fetch("/api/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: paramDocumentId,
                state: binaryState.toString("base64"),
              }),
            });
            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            setSaveMessage(`Document saved successfully with ID: ${result.id}`);
          } catch (error) {
            setSaveMessage("Failed to save document!");
          }
        }
      } else if (event.ctrlKey && event.key === "o") {
        event.preventDefault();
        setIsDocumentListOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editorRef.current, documentTitle, userName, paramDocumentId]);

  const handleNewDocument = () => {
    setIsNewDocumentPopupOpen(true);
  };

  const handleNewDocumentClose = () => {
    setIsNewDocumentPopupOpen(false);
  };

  const handleOpenDocument = () => {
    setIsDocumentListOpen(true);
  };

  const handleSaveDocument = async () => {
    if (editorRef.current) {
      const ydoc = editorRef.current.getYdoc();
      if (!ydoc) return;

      const metadata = ydoc.getMap("metadata");
      metadata.set("saved_at", new Date().toISOString());
      metadata.set("saved_by", userName);

      const binaryState = editorRef.current.getBinaryYDocState();
      try {
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: binaryState.toString("base64") }),
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setSaveMessage(`Document saved successfully with ID: ${result.id}`);
      } catch (error) {
        setSaveMessage("Failed to save document!");
      }
    }
  };

  const handleMenuToggle = () => setIsMenuOpen(!isMenuOpen);
  const handleMenuClose = () => setIsMenuOpen(false);
  const handleDocumentListClose = () => setIsDocumentListOpen(false);
  const handleSearchClick = () => setIsSearchPopupOpen(true);
  const handleLoadDocument = (documentId) => {
    handleDocumentListClose();
    router.push(`/${documentId}`);
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (event) => {
    const newTitle = event.target.value;
    setDocumentTitle(newTitle);
    if (editorRef.current?.setDocumentTitle) {
      editorRef.current.setDocumentTitle(newTitle);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (documentTitle.trim() === "") {
      setDocumentTitle("DocPub");
    }
  };

  const handleTitleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setIsEditingTitle(false);
      if (documentTitle.trim() === "") {
        setDocumentTitle("DocPub");
      }
    }
  };

  return (
    <main className="main-layout">
      <div className="header-container">
        <div className="document-header-row">
          {isEditingTitle ? (
            <input
              id="title-input"
              ref={titleInputRef}
              type="text"
              className="title-input"
              value={documentTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              aria-label="Document Title"
            />
          ) : (
            <h1 className="document-title" onClick={handleTitleClick}>
              {documentTitle}
            </h1>
          )}
          <div className="header-buttons-container">
            <button
              id="search-document-button"
              onClick={handleSearchClick}
              className="header-button"
              aria-label="Search Document"
            >
              <svg
                className="header-button-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button
              id="new-document-button"
              onClick={handleNewDocument}
              className="header-button"
              aria-label="New Document"
            >
              <svg
                className="header-button-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            <button
              id="open-document-button"
              onClick={handleOpenDocument}
              className="header-button"
              aria-label="Open Document"
            >
              <svg
                className="header-button-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              id="save-document-button"
              onClick={handleSaveDocument}
              className="header-button"
              aria-label="Save Document"
            >
              <svg
                className="header-button-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            </button>
            <button
              id="menu-button"
              onClick={handleMenuToggle}
              className="header-button"
            >
              <svg
                className="header-button-icon"
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
      </div>
      <div id="editor-wrapper-page">
        {!isLoading && (
          <DynamicQuillEditor
            editorRefProp={editorRef}
            userName={userName}
            onMetadataUpdateProp={handleMetadataUpdate}
            activeDocumentId={paramDocumentId}
            initialYDocState={initialEditorYDocState}
          />
        )}
      </div>
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
      <SearchDocumentPopup
        isOpen={isSearchPopupOpen}
        onClose={() => setIsSearchPopupOpen(false)}
      />
      <NewDocumentPopup
        isOpen={isNewDocumentPopupOpen}
        onClose={handleNewDocumentClose}
      />
      {saveMessage && <div className="save-message">{saveMessage}</div>}
    </main>
  );
}
