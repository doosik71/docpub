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
      const response = await fetch(
        `http://localhost:1234/api/documents?title=${currentFilter}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched documents:", data);

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
    onClose();
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div
        ref={popupRef}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold mb-4">Open Document</h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter by title..."
            className="w-full p-2 border border-gray-300 rounded-md"
            value={filter}
            onChange={handleFilterChange}
            onKeyUp={fetchDocuments} // Fetch on key up for filtering
          />
        </div>

        {loading && <p>Loading documents...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && documents.length === 0 && !error && (
          <p>No documents found.</p>
        )}

        {!loading && documents.length > 0 && (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Title</th>
                <th className="py-2 px-4 border-b">Saved At</th>
                <th className="py-2 px-4 border-b">Saved By</th>
                <th className="py-2 px-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="py-2 px-4 border-b">{doc.title}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(doc.saved_at).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b">{doc.saved_by}</td>
                  <td className="py-2 px-4 border-b text-right space-x-2">
                    <button
                      onClick={() => handleLoadClick(doc.id)}
                      className="bg-blue-500 text-white py-0 px-2 rounded-md hover:bg-blue-600 text-sm"
                    >
                      ⇪
                    </button>
                    <button
                      onClick={() => handleDeleteClick(doc.id, doc.title)}
                      className="bg-red-500 text-white py-0 px-2 rounded-md hover:bg-red-600 text-sm"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default DocumentListPopup;
