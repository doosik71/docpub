import React, { useState, useEffect } from 'react';
import './VersionHistory.css';

const VersionHistory = ({ isOpen, documentId, onClose, onViewMarkdown, onRestoreVersion }) => {
  if (!isOpen) {
    return null;
  }

  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `/api/documents/versions?id=${documentId}`;
        console.log("Fetching versions from URL:", url); // Log the URL
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP error! status: ${response.status}, text: ${errorText}`); // Log status and text
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        console.log("Successfully fetched versions:", data); // Log successful data
        setVersions(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))); // Sort by newest first
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



  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
  };

  const handleRestoreVersion = async () => {
    if (!selectedVersion) return;
    if (window.confirm("Are you sure you want to restore this version? This will overwrite the current document.")) {
      onRestoreVersion(selectedVersion.timestamp);
      onClose(); // Close the modal after triggering restore
    }
  };

  return (
    <div className="version-history-overlay" onClick={onClose}>
      <div className="version-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="version-history-header">
          <h2>Version History for Document: {documentId}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {loading && <p>Loading versions...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
            <div style={{ flex: '1', overflowY: 'auto', borderRight: '1px solid var(--border-color)' }}>
              <ul className="version-list">
                {versions.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center' }}>No versions found for this document.</p>
                ) : (
                  versions.map((version) => (
                    <li
                      key={version.timestamp}
                      className={`version-item ${selectedVersion?.timestamp === version.timestamp ? 'selected' : ''}`}
                      onClick={() => handleVersionSelect(version)}
                    >
                      <div className="version-summary">
                        <span className="version-title">{version.title || 'Untitled Version'}</span>
                        <span className="version-timestamp">
                          {new Date(version.timestamp).toLocaleString()} by {version.author || 'Unknown'}
                        </span>
                        {/* Optionally display a very short snippet of markdownSummary */}
                        {version.summary_markdown && (
                          <p className="summary-snippet">
                            {version.summary_markdown.substring(0, 100)}{version.summary_markdown.length > 100 ? '...' : ''}
                          </p>
                        )}
                        <div className="version-actions" style={{ marginTop: '5px' }}>
                            <button onClick={(e) => { e.stopPropagation(); onViewMarkdown(version.timestamp); }}>View Markdown</button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div style={{ flex: '2', overflowY: 'auto', padding: '15px 20px' }}>
              {selectedVersion ? (
                <div className="version-details">
                  <h3>Selected Version Details:</h3>
                  <p><strong>Title:</strong> {selectedVersion.title || 'Untitled'}</p>
                  <p><strong>Timestamp:</strong> {new Date(selectedVersion.timestamp).toLocaleString()}</p>
                  <p><strong>Author:</strong> {selectedVersion.author || 'Unknown'}</p>
                  <div className="version-actions">
                    <button onClick={handleRestoreVersion}>Restore This Version</button>
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: '20px' }}>Select a version from the left to see details.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
