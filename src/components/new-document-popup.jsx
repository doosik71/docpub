"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const NewDocumentPopup = ({ isOpen, onClose }) => {
  const popupRef = useRef(null);
  const [newId, setNewId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

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
      setNewId("");
      setError("");
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleIdChange = (e) => {
    const value = e.target.value;
    // Allow only lowercase letters, numbers, and hyphens
    const sanitizedValue = value.replace(/[^a-z0-9-]/g, "");
    // Limit length to 32 characters
    setNewId(sanitizedValue.slice(0, 32));
  };

  const handleCreate = () => {
    if (!newId.trim()) {
      setError("Document ID cannot be empty.");
      return;
    }
    router.push(`/doc/${newId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-popup-overlay">
      <div ref={popupRef} className="search-popup-content">
        <h2 className="search-popup-title">Create New Document</h2>

        <div className="search-input-container">
          <input
            type="text"
            placeholder="Enter new document ID..."
            className="search-input-field"
            value={newId}
            onChange={handleIdChange}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <button
            onClick={handleCreate}
            className="search-button"
          >
            Create
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
        <p className="text-sm text-gray-500">
          Only lowercase letters, numbers, and hyphens are allowed. Max 32 characters.
        </p>

        <button onClick={onClose} className="search-popup-close-button">
          &times;
        </button>
      </div>
    </div>
  );
};

export default NewDocumentPopup;
