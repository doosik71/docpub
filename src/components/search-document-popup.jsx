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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div
        ref={popupRef}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold mb-4">Search Documents</h2>

        <div className="flex mb-4">
          <input
            type="text"
            placeholder="Search by title..."
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        {loading && <p>Searching...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && searchResults.length === 0 && searchQuery.trim() && !error && (
          <p>No documents found matching your query.</p>
        )}
        {!loading && searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {searchResults.map((doc) => (
                <li
                  key={doc.id}
                  className="p-3 flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-gray-500">
                      Saved by {doc.saved_by} at{" "}
                      {new Date(doc.saved_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenDocumentInNewTab(doc.id)}
                    className="bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          </div>
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

export default SearchDocumentPopup;
