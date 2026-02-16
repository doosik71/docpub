"use client";

import React, { useRef, useEffect, useState } from "react";

const DocumentListPopup = ({ isOpen, onClose, onLoadDocument }) => {
  const popupRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
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
      fetchDocuments(); // Fetch documents when popup opens
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const fetchDocuments = async (currentFilter = filter) => {
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
    // Debounce this later if performance is an issue for frequent typing
    fetchDocuments(event.target.value);
  };

  const handleLoadClick = (documentId) => {
    onLoadDocument(documentId);
    // onClose();
  };

  const handleDeleteClick = async (documentId, documentTitle) => {
    if (window.confirm(`Are you sure you want to delete "${documentTitle}"?`)) {
      try {
        const response = await fetch(
          `http://localhost:1234/api/documents/${documentId}`,
          {
            method: "DELETE",
          },
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Refresh the list after successful deletion
        fetchDocuments();
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
            onKeyUp={fetchDocuments} // Fetch on key up for filtering
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
                <th className="document-list-th document-list-th-actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="document-list-td">{doc.title}</td>
                  <td className="document-list-td">
                    {new Date(doc.saved_at).toLocaleString()}
                  </td>
                  <td className="document-list-td">{doc.saved_by}</td>
                  <td className="document-list-td document-list-td-actions">
                    <button
                      id="load-button"
                      onClick={() => handleLoadClick(doc.id)}
                      className="document-list-load-button"
                    >
                      Open
                    </button>
                    <button
                      id="delete-button"
                      onClick={() => handleDeleteClick(doc.id, doc.title)}
                      className="document-list-delete-button"
                      disabled={doc.id === "index"} // Disable if doc.id is "index"
                    >
                      DEL
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
