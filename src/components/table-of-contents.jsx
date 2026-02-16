// src/components/table-of-contents.jsx
import React from "react";

const TableOfContents = ({ headings, onClose }) => {
  if (!headings || headings.length === 0) {
    return null;
  }

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="table-of-contents-container">
      <div className="toc-header">
        <h3>Table of Contents</h3>
        <button onClick={onClose} className="toc-close-button">
          ✖
        </button>
      </div>
      <nav>
        <ul>
          {headings.map((heading) => (
            <li key={heading.id} className={`heading-level-${heading.level}`}>
              <a onClick={() => scrollToHeading(heading.id)}>
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default TableOfContents;
