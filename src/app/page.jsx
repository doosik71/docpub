"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import MenuPopup from "../components/menu-popup";
import { themes } from "../lib/themes"; // Import themes

const DynamicQuillEditor = dynamic(
  () => import("../components/editor/index.jsx"),
  { ssr: false },
);

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Guest"); // Default user name
  const [theme, setTheme] = useState("light"); // Default theme ID

  // Effect to apply theme CSS variables to html element
  useEffect(() => {
    const selectedTheme = themes.find((t) => t.id === theme);
    if (selectedTheme) {
      for (const [key, value] of Object.entries(selectedTheme.colors)) {
        document.documentElement.style.setProperty(key, value);
      }
    }
  }, [theme]);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-4 px-4">
      <div className="w-full max-w-[794px] flex justify-between items-center">
        <h1 className="text-4xl font-bold">DocPub</h1>{" "}
        <button
          onClick={handleMenuToggle}
          className="p-2 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Reduced bottom margin */}
      <div
        id="editor-wrapper-page"
        className="w-full max-w-[794px] rounded-lg flex flex-col h-[calc(100vh-6rem)]" // Re-added fixed height
      >
        {" "}
        {/* Removed fixed height constraint */}
        <DynamicQuillEditor userName={userName} />
      </div>
      <MenuPopup
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        userName={userName}
        setUserName={setUserName}
        theme={theme}
        setTheme={setTheme}
      />
    </main>
  );
}
