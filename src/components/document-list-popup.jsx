"use client";

import React, { useRef, useEffect, useState } from "react";
import { formatDateTime } from "@/lib/date-utils";

// useDebounce Hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const debounceEffect = () => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      const clearDebounceTimeout = () => {
        clearTimeout(handler);
      };
      return clearDebounceTimeout;
    };
    return debounceEffect();
  }, [value, delay]);

  return debouncedValue;
}

const DocumentListPopup = ({ isOpen, onClose, onLoadDocument }) => {
  const popupRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounced filter value
  const debouncedFilter = useDebounce(filter, 500); // 500ms debounce delay

  const setupPopupEventListeners = () => {
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
      // Initial fetch when popup opens, no filter applied yet
      fetchDocuments("");
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  };
  useEffect(setupPopupEventListeners, [isOpen, onClose]);

  // Effect to fetch documents when debouncedFilter changes
  const fetchDocumentsOnFilterChange = () => {
    if (isOpen) {
      // Only fetch if the popup is open
      fetchDocuments(debouncedFilter);
    }
  };
  useEffect(fetchDocumentsOnFilterChange, [debouncedFilter, isOpen]); // Rerun when debouncedFilter changes or popup opens/closes

  const fetchDocuments = async (currentFilter) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents?title=${currentFilter}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // console.log("Fetched documents:", data);

      setDocuments(data);
    } catch (e) {
      console.error("Error fetching documents:", e);
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    // fetchDocuments will now be triggered by debouncedFilter useEffect
  };

  const handleLoadClick = (documentId) => {
    onLoadDocument(documentId);
    // onClose();
  };

  const handleDeleteClick = async (documentId, documentTitle) => {
    if (window.confirm(`Are you sure you want to delete "${documentTitle}"?`)) {
      try {
        const response = await fetch(`/api/documents?id=${documentId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Refresh the list after successful deletion
        fetchDocuments(filter); // Use current filter to refresh
      } catch (e) {
        console.error("Error deleting document:", e);
        setError("Failed to delete document.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="document-list-popup-overlay">
      <div ref={popupRef} className="document-list-popup-content">
        <h2 className="document-list-popup-title">Open Document</h2>

        <div className="document-list-filter-container">
          <input
            type="text"
            placeholder="Filter by title..."
            className="document-list-filter-input"
            value={filter}
            onChange={handleFilterChange}
          />
        </div>

        {loading && (
          <p className="document-list-message">Loading documents...</p>
        )}
        {error && <p className="document-list-error-message">{error}</p>}

        {!loading && documents.length === 0 && !error && (
          <p className="document-list-message">No documents found.</p>
        )}

        {!loading && documents.length > 0 && (
          <table className="document-list-table">
            <thead>
              <tr>
                <th className="document-list-th">Title</th>
                <th className="document-list-th">Saved At</th>
                <th className="document-list-th">Saved By</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => {
                    handleLoadClick(doc.id);
                    onClose();
                  }}
                  className="cursor-pointer"
                >
                  <td className="document-list-td">{doc.title}</td>
                  <td className="document-list-td">
                    {formatDateTime(doc.saved_at)}
                  </td>
                  <td className="document-list-td document-list-td-saved-by">
                    <span className="document-list-saved-by-text">
                      {doc.saved_by}
                    </span>
                    <button
                      id="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(doc.id, doc.title);
                      }}
                      className="document-list-delete-button"
                      disabled={doc.id === "index"}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button onClick={onClose} className="document-list-close-button">
          &times;
        </button>
      </div>
    </div>
  );
};

export default DocumentListPopup;
