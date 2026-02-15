"use client";

import React, { useRef, useEffect, useState } from "react";

const SearchDocumentPopup = ({ isOpen, onClose }) => {
  const popupRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // Clear search results and query when opened
      setSearchQuery("");
      setSearchResults([]);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents?title=${searchQuery}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (e) {
      console.error("Error searching documents:", e);
      setError("Failed to search documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocumentInNewTab = (documentId) => {
    window.open(`/${documentId}`, "_blank");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-popup-overlay">
      <div ref={popupRef} className="search-popup-content">
        <h2 className="search-popup-title">Search Documents</h2>

        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search by title..."
            className="search-input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <button
            onClick={handleSearch}
            className="search-button"
          >
            <svg
              className="search-button-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        {loading && <p>Searching...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && searchResults.length === 0 && searchQuery.trim() && !error && (
          <p>No documents found matching your query.</p>
        )}
        {!loading && searchResults.length > 0 && (
          <div className="search-results-container">
            <h3 className="search-results-heading">Search Results:</h3>
            <ul className="search-results-list">
              {searchResults.map((doc) => (
                <li
                  key={doc.id}
                  className="search-result-item"
                >
                  <div>
                    <p className="search-result-title">{doc.title}</p>
                    <p className="search-result-meta">
                      Saved by {doc.saved_by} at{" "}
                      {new Date(doc.saved_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenDocumentInNewTab(doc.id)}
                    className="search-result-open-button"
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={onClose} className="search-popup-close-button">
          &times;
        </button>
      </div>
    </div>
  );
};

export default SearchDocumentPopup;
