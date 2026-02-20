// src/lib/themes.js

export const themes = [
  {
    id: "light",
    name: "Light",
    colors: {
      "--background": "#ffffff",
      "--foreground": "#171717",
      "--text-color": "#171717", /* Use foreground */
      "--header-background-color": "#f8f8f8", /* Slightly off-white */
      "--border-color": "#e0e0e0", /* Light gray border */
      "--primary-color": "#007bff", /* A standard blue */
      "--primary-hover-color": "#0056b3", /* Darker blue on hover */
      "--hover-background-color": "#f0f0f0", /* Light gray for hover */
      "--selection-background-color": "#e9ecef", /* Slightly darker gray for selection */
      "--secondary-text-color": "#6c757d", /* Muted gray for secondary text */
      "--button-text-color": "#ffffff", /* White text for primary buttons */
      "--error-color": "#dc3545", /* Red for errors */
    },
  },
  {
    id: "dark",
    name: "Dark",
    colors: {
      "--background": "#0a0a0a",
      "--foreground": "#ededed",
    },
  },
  {
    id: "beige",
    name: "Beige",
    colors: {
      "--background": "#fdf5e6",
      "--foreground": "#8b4513",
    },
  },
  {
    id: "forest",
    name: "Forest",
    colors: {
      "--background": "#e8f5e9",
      "--foreground": "#1b5e20",
    },
  },
  {
    id: "gray",
    name: "Gray",
    colors: {
      "--background": "#f5f5f5",
      "--foreground": "#424242",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: {
      "--background": "#e0f2f7",
      "--foreground": "#004e66",
    },
  },
  {
    id: "sepia",
    name: "Sepia",
    colors: {
      "--background": "#fbf0d9",
      "--foreground": "#5c4033",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: {
      "--background": "#fff3e0",
      "--foreground": "#e65100",
    },
  },
];
