"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect, useRef, useCallback } from "react";
import MenuPopup from "../../../components/menu-popup";
import DocumentListPopup from "../../../components/document-list-popup";
import SearchDocumentPopup from "../../../components/search-document-popup";
import NewDocumentPopup from "../../../components/new-document-popup";
import GeminiPopup from "../../../components/gemini-popup";
import TableOfContents from "../../../components/table-of-contents"; // Added import
import { themes } from "../../../lib/themes";
import { streamGeminiResponse } from "../../../lib/gemini";
import { useRouter } from "next/navigation";
import converter from "@workiom/delta-md-converter";

const DynamicQuillEditor = dynamic(
  () => import("../../../components/editor/index.jsx"),
  { ssr: false },
);

export default function DocumentPage({ params }) {
  const router = useRouter();
  const { documentId: paramDocumentId } = params;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDocumentListOpen, setIsDocumentListOpen] = useState(false);
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const [isNewDocumentPopupOpen, setIsNewDocumentPopupOpen] = useState(false);
  const [isGeminiPopupOpen, setIsGeminiPopupOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false); // Added state for TOC
  const [tableOfContentsHeadings, setTableOfContentsHeadings] = useState([]); // Added state for TOC headings
  const [hasSelection, setHasSelection] = useState(false); // State to pass to GeminiPopup
  const [currentSelectedText, setCurrentSelectedText] = useState(""); // Stores the selected text
  const [currentSelectionRange, setCurrentSelectionRange] = useState(null); // Stores the selected range for insertion
  const [userName, setUserName] = useState("Guest");
  const [theme, setTheme] = useState("light");
  const [documentTitle, setDocumentTitle] = useState("DocPub");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const titleInputRef = useRef(null);
  const editorRef = useRef(null);
  const [initialEditorYDocState, setInitialEditorYDocState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce utility function
  const debounce = useCallback((func, delay) => {
    let timeout;
    return function executed(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, delay);
    };
  }, []);

  // Function to extract headings from Quill Delta
  const extractHeadings = useCallback((delta) => {
    const headings = [];
    const headingIdCounter = {};
    const blockCandidates = []; // Stores objects { text, level, attributes } for lines
    let currentLine = { text: "", attributes: {} }; // Accumulates text and attributes for the current logical line

    if (!delta || !delta.ops) {
      return headings;
    }

    delta.ops.forEach((op) => {
      // Merge attributes, giving priority to block-level attributes for the current line
      // This ensures that attributes from an `insert: '\n'` op are associated with the line
      if (op.attributes) {
        currentLine.attributes = {
          ...currentLine.attributes,
          ...op.attributes,
        };
      }

      if (typeof op.insert === "string") {
        const textSegments = op.insert.split("\n");
        currentLine.text += textSegments[0]; // Add text before the first newline in this op

        // If there are newlines within this op.insert, it means we've completed one or more lines
        for (let i = 1; i < textSegments.length; i++) {
          // If the current line (just completed by a newline) has a header attribute
          if (currentLine.attributes.header) {
            blockCandidates.push({
              text: currentLine.text, // Don't trim yet, markdown might be at start
              level: currentLine.attributes.header,
              attributes: currentLine.attributes,
            });
          }
          // Reset for the next line, carrying over text after the newline in the current op
          currentLine = { text: textSegments[i], attributes: {} };
          // Important: attributes from previous op for non-header should not persist to next line automatically.
          // block-level attributes are typically consumed by the newline they apply to.
          // So, for the new line, we only take attributes from the `op` itself, not accumulated `currentLine.attributes`.
          // This is a subtle and important correction to `currentLine = { text: textSegments[i], attributes: {} };`
          // If attributes in the original `op` had 'header', they were for the *just completed* line.
          // The next line starts fresh.
        }
      } else {
        // Non-string insert (embed, image, etc.) effectively ends the current logical line/block.
        // Process currentLine if it's a header.
        if (currentLine.attributes.header) {
          blockCandidates.push({
            text: currentLine.text,
            level: currentLine.attributes.header,
            attributes: currentLine.attributes,
          });
        }
        // Reset for the new block which is an embed.
        currentLine = { text: "", attributes: {} };
      }
    });

    // After iterating through all ops, process any remaining currentLine if it's a header
    // This handles cases where the document doesn't end with a newline or has a header at the end.
    if (currentLine.attributes.header && currentLine.text.trim()) {
      blockCandidates.push({
        text: currentLine.text,
        level: currentLine.attributes.header,
        attributes: currentLine.attributes,
      });
    }

    // Now, process `blockCandidates` to finalize headings.
    // The provided Delta contains markdown syntax like "## 개요 2" directly in `op.insert` for some ops.
    // This means we might need to strip markdown syntax from `headingText`.
    blockCandidates.forEach((candidate) => {
      let textToProcess = candidate.text;
      let level = candidate.level;

      // Attempt to strip markdown heading syntax if it's present in the text.
      // This is a workaround for the observed Delta structure.
      const match = textToProcess.match(/^(#+)\s*(.*)$/);
      if (match) {
        level = Math.min(match[1].length, 6); // Ensure level doesn't exceed h6
        textToProcess = match[2].trim();
      } else {
        // If no markdown match, just trim the text
        textToProcess = textToProcess.trim();
      }

      if (textToProcess) {
        let baseId = textToProcess
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

        headings.push({ level, text: textToProcess, id });
      }
    });

    // console.log("Extracted headings (attempt 4):", headings);
    return headings;
  }, []);

  const handleContentChange = useCallback(
    (delta) => {
      // console.log("handleContentChange received delta:", delta); // Debug log
      const extracted = extractHeadings(delta);
      setTableOfContentsHeadings(extracted);
    },
    [extractHeadings],
  );

  const debouncedHandleContentChange = useCallback(
    debounce(handleContentChange, 5000), // 5-second debounce
    [debounce, handleContentChange],
  );

  // Debug log for tableOfContentsHeadings updates
  useEffect(() => {
    // console.log("tableOfContentsHeadings updated:", tableOfContentsHeadings);
  }, [tableOfContentsHeadings]);

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
    // This effect ensures the TOC is generated immediately after the document loads
    // and the editor is initialized with its content.
    if (initialEditorYDocState !== null && editorRef.current) {
      const quillInstance = editorRef.current.getQuill();
      if (quillInstance) {
        // Get the current contents from Quill and pass to the non-debounced handler
        // to populate the TOC immediately.
        const currentContents = quillInstance.getContents();
        // console.log("Initial load: Triggering handleContentChange with:", currentContents);
        handleContentChange(currentContents);
      }
    }
  }, [initialEditorYDocState, editorRef.current, handleContentChange]);

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
      } else if (event.ctrlKey && event.key === "g") {
        event.preventDefault();

        // 코드 중복 작성을 피하고 가급적 기존 함수를 사용할 것.
        handleGeminiClick();
      } else if (event.ctrlKey && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        if (editorRef.current) {
          const quill = editorRef.current.getQuill();
          if (quill) {
            const range = quill.getSelection();
            if (range) {
              const headingLevel = parseInt(event.key, 10);
              quill.formatLine(
                range.index,
                range.length,
                "header",
                headingLevel,
              );
            }
          }
        }
      } else if (event.ctrlKey && event.key === "0") {
        event.preventDefault();
        if (editorRef.current) {
          const quill = editorRef.current.getQuill();
          if (quill) {
            const range = quill.getSelection();
            if (range) {
              quill.removeFormat(range.index, range.length); // Remove all formats
            }
          }
        }
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

  const handleDownloadMarkdown = () => {
    if (editorRef.current) {
      const ydoc = editorRef.current.getYdoc();

      if (ydoc) {
        const deltaOps = ydoc.getText("quill").toDelta();
        const markdown = converter.deltaToMarkdown(deltaOps);
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${documentTitle || "document"}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleMenuToggle = () => setIsMenuOpen(!isMenuOpen);
  const handleMenuClose = () => setIsMenuOpen(false);
  const handleDocumentListClose = () => setIsDocumentListOpen(false);
  const handleSearchClick = () => setIsSearchPopupOpen(true);

  const handleGeminiClick = () => {
    if (editorRef.current) {
      const quill = editorRef.current.getQuill();
      if (quill) {
        const selection = quill.getSelection();
        const isTextSelected = !!(selection && selection.length > 0);
        setHasSelection(isTextSelected);
        const selectedText = isTextSelected
          ? quill.getText(selection.index, selection.length)
          : "";
        setCurrentSelectedText(selectedText);
        setCurrentSelectionRange(selection); // Capture the range
      } else {
        setHasSelection(false);
        setCurrentSelectedText("");
        setCurrentSelectionRange(null); // Clear the range
      }
    } else {
      setHasSelection(false);
      setCurrentSelectedText("");
      setCurrentSelectionRange(null); // Clear the range
    }
    setIsGeminiPopupOpen(true);
  };
  const handleGeminiClose = () => setIsGeminiPopupOpen(false);

  const handleSendToGemini = ({
    prompt,
    insertionMode,
    sendSelectedText,
    sendWholeDocument,
  }) => {
    if (!editorRef.current) return;

    const quill = editorRef.current.getQuill();
    if (!quill) return;

    let initialInsertionIndex =
      currentSelectionRange?.index ?? quill.getLength(); // Use currentSelectionRange or end

    let fullPrompt = `User request: ${prompt}

`;
    let contentForGemini = "";

    const fullDocumentContent = quill.getText();

    if (sendSelectedText && currentSelectedText) {
      contentForGemini += `Selected text for analysis: "${currentSelectedText}"

`;
    }

    if (sendWholeDocument) {
      contentForGemini += `Full document content:
${fullDocumentContent}

`;
    }

    fullPrompt += contentForGemini;

    // Determine initial insertion point based on insertionMode
    switch (insertionMode) {
      case "replace":
        // If there's a selection, replace it. Otherwise, it implicitly acts like 'insert'
        // where initialInsertionIndex is already set to the cursor position.
        if (currentSelectionRange && currentSelectionRange.length > 0) {
          quill.deleteText(
            currentSelectionRange.index,
            currentSelectionRange.length,
            "api",
          );
        }
        break;
      case "append":
        initialInsertionIndex = quill.getLength();
        quill.insertText(initialInsertionIndex, "\n", "api"); // Add new lines before appending
        initialInsertionIndex += 2; // Adjust index for new lines
        break;
      case "insert":
      default:
        if (hasSelection && currentSelectionRange) {
          initialInsertionIndex =
            currentSelectionRange.index + currentSelectionRange.length;
        }

        quill.insertText(initialInsertionIndex, "\n\n", "api"); // Add new lines before appending
        initialInsertionIndex += 2;

        break;
    }

    let currentInsertionIndex = initialInsertionIndex;

    streamGeminiResponse(
      fullPrompt,
      (chunk) => {
        quill.insertText(currentInsertionIndex, chunk, "api");
        currentInsertionIndex += chunk.length;
        quill.setSelection(currentInsertionIndex);
      },
      () => {
        setSaveMessage("Gemini response complete!");
      },
    );
  };

  const handleLoadDocument = (documentId) => {
    handleDocumentListClose();
    router.push(`/doc/${documentId}`);
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
              id="gemini-button"
              onClick={handleGeminiClick}
              className="header-button"
              aria-label="Ask Gemini"
            >
              ✨
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
            <button
              id="toc-button"
              onClick={() => {
                setIsTocOpen(!isTocOpen);
              }}
              className="header-button"
              aria-label="Table of Contents"
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
                  d="M4 6h16M4 12h16M4 18h7"
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
            onContentChangeProp={debouncedHandleContentChange} // Added this prop
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
        onDownloadMarkdown={handleDownloadMarkdown}
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
      <GeminiPopup
        isOpen={isGeminiPopupOpen}
        onClose={handleGeminiClose}
        onSend={handleSendToGemini}
        hasSelection={hasSelection}
        currentSelectedText={currentSelectedText}
      />
      {saveMessage && <div className="save-message">{saveMessage}</div>}
      {isTocOpen && (
        <TableOfContents
          headings={tableOfContentsHeadings}
          onClose={() => setIsTocOpen(false)}
        />
      )}
    </main>
  );
}
