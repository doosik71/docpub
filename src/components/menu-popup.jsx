"use client";

import React, { useRef, useEffect, useState } from "react";
import { themes } from "@/lib/themes"; // Import themes

const MenuPopup = ({ isOpen, onClose, userName, setUserName, theme, setTheme }) => {
  const popupRef = useRef(null);
  const [currentUserNameInput, setCurrentUserNameInput] = useState(userName);

  useEffect(() => {
    setCurrentUserNameInput(userName);
  }, [userName]);

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
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleSaveUserName = () => {
    setUserName(currentUserNameInput);
    onClose();
  };

  const handleThemeChange = (newThemeId) => {
    setTheme(newThemeId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="menu-popup-overlay">
      <div ref={popupRef} className="menu-popup-content">
        <h2 className="menu-popup-title">Menu</h2>

        <div className="menu-section">
          <label htmlFor="userName" className="menu-label">User Name</label>
          <input
            type="text"
            id="userName"
            className="menu-input-field"
            value={currentUserNameInput}
            onChange={(e) => setCurrentUserNameInput(e.target.value)}
          />
          <button
            onClick={handleSaveUserName}
            className="menu-save-button"
          >
            Save User Name
          </button>
        </div>

        <div className="menu-section">
          <label className="menu-label menu-label-bottom-margin">Theme</label>
          <div className="theme-options-container">
            {themes.map((t) => (
              <label key={t.id} className="theme-option-label">
                <input
                  type="radio"
                  className="theme-radio-input"
                  name="themeOption"
                  value={t.id}
                  checked={theme === t.id}
                  onChange={() => handleThemeChange(t.id)}
                />
                <span
                  className="theme-option-display"
                  style={{
                    backgroundColor: t.colors['--background'],
                    color: t.colors['--foreground'],
                  }}
                >
                  {t.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button onClick={onClose} className="menu-popup-close-button">
          &times;
        </button>
      </div>
    </div>
  );
};

export default MenuPopup;
