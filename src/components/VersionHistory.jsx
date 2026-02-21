import React, { useState, useEffect } from "react";
import "./VersionHistory.css";

const VersionHistory = ({
  isOpen,
  documentId,
  onClose,
  onViewMarkdown,
  onRestoreVersion,
  onDeleteVersion, // New prop
}) => {
  if (!isOpen) {
    return null;
  }

  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersionMarkdown, setSelectedVersionMarkdown] = useState(null); // New state

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `/api/documents/versions?id=${documentId}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `HTTP error! status: ${response.status}, text: ${errorText}`,
          ); // Log status and text
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`,
          );
        }

        const data = await response.json();
        setVersions(
          data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        ); // Sort by newest first
      } catch (e) {
        console.error("Failed to fetch versions (catch block):", e); // Log catch block errors
        setError("Failed to load version history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchVersions();
    }
  }, [documentId]);

  const handleVersionSelect = async (version) => {
    // Made async
    setSelectedVersion(version);
    setSelectedVersionMarkdown(null); // Clear previous markdown

    try {
      const response = await fetch(
        `/api/documents/version-content?id=${documentId}&timestamp=${version.timestamp}&format=markdown`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch markdown for version: ${response.statusText}`,
        );
      }
      const markdownContent = await response.text();
      setSelectedVersionMarkdown(markdownContent);
    } catch (e) {
      console.error("Error fetching version markdown:", e);
      setSelectedVersionMarkdown("Failed to load markdown content.");
    }
  };

  const handleDeleteVersion = async () => {
    if (!selectedVersion) return;
    if (
      window.confirm(
        `Are you sure you want to delete the version from ${new Date(selectedVersion.timestamp).toLocaleString()}? This action cannot be undone.`,
      )
    ) {
      onDeleteVersion(selectedVersion.timestamp);
    }
  };

  const handleRestoreVersion = async () => {
    if (!selectedVersion) return;
    if (
      window.confirm(
        "Are you sure you want to restore this version? This will overwrite the current document.",
      )
    ) {
      onRestoreVersion(selectedVersion.timestamp);
      onClose(); // Close the modal after triggering restore
    }
  };

  return (
    <div className="version-history-overlay" onClick={onClose}>
      <div
        className="version-history-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="version-history-header">
          <h2>Version History for Document: {documentId}</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        {loading && <p>Loading versions...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="version-history-body">
            <div className="version-list-pane">
              <ul className="version-list">
                {versions.length === 0 ? (
                  <p className="version-placeholder-message">
                    No versions found for this document.
                  </p>
                ) : (
                  versions.map((version) => (
                    <li
                      key={version.timestamp}
                      className={`version-item ${selectedVersion?.timestamp === version.timestamp ? "selected" : ""}`}
                      onClick={() => handleVersionSelect(version)}
                    >
                      <div className="version-summary">
                        <span className="version-title">
                          {version.title || "Untitled Version"}
                        </span>
                        <span className="version-timestamp">
                          {new Date(version.timestamp).toLocaleString()}
                        </span>
                        <span className="version-author">
                          {version.author || "Unknown"}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="version-details-pane">
              {selectedVersion ? (
                <div className="version-details">
                  <div className="version-actions">
                    <button onClick={handleRestoreVersion}>
                      Restore
                    </button>
                    <button
                      onClick={handleDeleteVersion}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                  <p>
                    <strong>Title:</strong>{" "}
                    {selectedVersion.title || "Untitled"}
                  </p>
                  <p>
                    <strong>Timestamp:</strong>{" "}
                    {new Date(selectedVersion.timestamp).toLocaleString()}
                  </p>
                  <p>
                    <strong>Author:</strong>{" "}
                    {selectedVersion.author || "Unknown"}
                  </p>
                  {selectedVersionMarkdown && (
                    <>
                      <hr />
                      <pre className="markdown-preview">
                        {selectedVersionMarkdown}
                      </pre>
                    </>
                  )}
                </div>
              ) : (
                <p className="version-placeholder-message">
                  Select a version from the left to see details.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
