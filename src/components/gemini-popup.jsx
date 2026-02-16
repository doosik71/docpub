"use client";

import React, { useRef, useEffect, useState } from "react";

const GeminiPopup = ({ isOpen, onClose, onSend, hasSelection }) => {
  const popupRef = useRef(null);
  const [prompt, setPrompt] = useState("");
  const [insertionMode, setInsertionMode] = useState("insert"); // 'insert', 'replace', 'append'
  const [sendSelectedText, setSendSelectedText] = useState(false);
  const [sendWholeDocument, setSendWholeDocument] = useState(false); // Changed to false by default

  // Effect to manage outside clicks and escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
      const savedPrompt = localStorage.getItem("geminiPrompt");
      setPrompt(savedPrompt || ""); // Load saved prompt or clear
      setInsertionMode("insert"); // Reset to default

      // Initial state for send modes based on hasSelection
      setSendSelectedText(hasSelection); // Check selected if available
      setSendWholeDocument(false); // Do not check whole document by default
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose, hasSelection]);

  // Effect to save prompt to localStorage
  useEffect(() => {
    localStorage.setItem("geminiPrompt", prompt);
  }, [prompt]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    onSend({ prompt, insertionMode, sendSelectedText, sendWholeDocument });
    onClose(); // Close the popup after sending
  };

  if (!isOpen) return null;

  return (
    <div className="search-popup-overlay">
      <div ref={popupRef} className="search-popup-content">
        <h2 className="search-popup-title">Ask Gemini</h2>

        <div className="gemini-prompt-container">
          <textarea
            placeholder="Enter your request for Gemini..."
            className="gemini-prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="gemini-options-columns">
          <div className="gemini-options-column">
            <label className="gemini-label-heading">Send Content:</label>
            <label>
              <input
                type="checkbox"
                name="send-selected-text"
                checked={sendSelectedText}
                onChange={(e) => setSendSelectedText(e.target.checked)}
                disabled={!hasSelection}
              />
              Send selected text
            </label>
            <label>
              <input
                type="checkbox"
                name="send-whole-document"
                checked={sendWholeDocument}
                onChange={(e) => setSendWholeDocument(e.target.checked)}
                disabled={false} // Always enabled
              />
              Send whole document
            </label>
          </div>

          <div className="gemini-options-column">
            <label className="gemini-label-heading">Insert Response:</label>
            <label>
              <input
                type="radio"
                name="insertion-mode"
                value="insert"
                checked={insertionMode === 'insert'}
                onChange={(e) => setInsertionMode(e.target.value)}
              />
              Insert at cursor
            </label>
            <label>
              <input
                type="radio"
                name="insertion-mode"
                value="replace"
                checked={insertionMode === 'replace'}
                onChange={(e) => setInsertionMode(e.target.value)}
                disabled={!hasSelection}
              />
              Replace selected text
            </label>
            <label>
              <input
                type="radio"
                name="insertion-mode"
                value="append"
                checked={insertionMode === 'append'}
                onChange={(e) => setInsertionMode(e.target.value)}
              />
              Append to end of document
            </label>
          </div>
        </div>

        <button
          onClick={handleSend}
          className="menu-save-button" // Re-using existing button style
        >
          Send to Gemini
        </button>

        <button onClick={onClose} className="search-popup-close-button">
          &times;
        </button>
      </div>
    </div>
  );
};

export default GeminiPopup;
