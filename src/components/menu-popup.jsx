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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div ref={popupRef} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm relative">
        <h2 className="text-xl font-bold mb-4">Menu</h2>

        <div className="mb-6">
          <label htmlFor="userName" className="block text-sm font-medium text-gray-700">User Name</label>
          <input
            type="text"
            id="userName"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={currentUserNameInput}
            onChange={(e) => setCurrentUserNameInput(e.target.value)}
          />
          <button
            onClick={handleSaveUserName}
            className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Save User Name
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
          <div className="flex flex-wrap gap-4">
            {themes.map((t) => (
              <label key={t.id} className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="themeOption"
                  value={t.id}
                  checked={theme === t.id}
                  onChange={() => handleThemeChange(t.id)}
                />
                <span
                  className="ml-2 p-1 rounded"
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

export default MenuPopup;
