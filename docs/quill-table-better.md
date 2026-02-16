# Quill Better Table Module Usage Guide

This guide details how to integrate and configure the `quill-table-better` module with Quill.js, focusing on installation, basic setup, and localization.

## 1. Installation

First, install the `quill-table-better` package using npm or yarn:

```bash
npm install quill-table-better
# or
yarn add quill-table-better
```

## 2. Basic Integration with Quill

To use the `quill-table-better` module, you need to import it, its stylesheet, and register it with Quill. Then, include it in your Quill editor's modules configuration.

### Example: `src/components/editor/index.jsx`

```javascript
import Quill from "quill";
import QuillBetterTable from "quill-table-better";
import "quill-table-better/dist/quill-table-better.css";

// Register the module with Quill
// It's recommended to register before initializing Quill
Quill.register("modules/better-table", QuillBetterTable, true);

// ... inside your Quill initialization where you define modules ...
const quill = new Quill("#editor-container", {
  theme: "snow",
  modules: {
    toolbar: {
      container: "#quill-toolbar",
      handlers: {
        // Optionally disable Quill's default table handler if it conflicts
        table: false,
      },
    },
    // Configure quill-better-table
    "better-table": {
      operationMenu: {
        items: {
          // You can customize individual menu item texts here
          // e.g., insertColumnLeft: { text: 'Insert Col Left' },
        },
      },
      // Localization setting for built-in languages
      localization: {
        locale: "en_US", // Use 'en_US' for English. Other options include 'zh_CN', 'fr_FR', etc.
      },
      // Other optional configurations
      // toolbarTable: false, // Set to true if you want the built-in toolbar table button
    },
    history: { userOnly: true },
    // ... other modules ...
  },
  placeholder: "Start writing...",
});
```

### Key Configuration Points:

- **`Quill.register('modules/better-table', QuillBetterTable, true);`**: This line registers the `QuillBetterTable` module under the name `better-table`. The `true` argument indicates that this is a "blot" (format) that should be registered.
- **`toolbar.handlers.table: false`**: If your toolbar configuration includes Quill's default table functionality (e.g., `ql-table` button), it's often a good idea to disable it to avoid conflicts with `quill-better-table`.
- **`'better-table'` module configuration**:
  - **`localization.locale: 'en_US'`**: This is the primary way to set the language for the table operation menu. The module ships with several built-in languages (e.g., `'en_US'`, `'zh_CN'`, `'fr_FR'`, `'de_DE'`).
  - **`operationMenu.items`**: You can override specific menu item texts here if you need custom phrasing or if a particular language isn't fully supported or translated to your liking. The keys for these items correspond to the internal operation names (e.g., `insertColumnLeft`, `removeRow`, `mergeCells`, `setCellBackgroundColor`).
  - **`toolbarTable`**: If set to `true`, the module will attempt to render its own table button in the toolbar. This might require additional setup depending on your Quill toolbar structure.

## 3. Custom Localization (Advanced)

If you need a language not provided by default, or want to provide entirely custom translations, you can pass an object to the `language` option in the module's `Options`:

```javascript
// Example of a custom language object
const customLanguage = {
  name: 'my_custom_lang',
  content: {
    insertColumnLeft: 'Add Column Left',
    insertColumnRight: 'Add Column Right',
    // ... provide all necessary translations
  }
};

// ... inside your Quill initialization ...
'better-table': {
  operationMenu: { /* ... */ },
  localization: {
    locale: customLanguage // Pass your custom language object here
  }
  // ...
},
```

In this case, the `locale` property of `localization` would take the `customLanguage` object directly, rather than a string.

## 4. Key Takeaways

- **Localization is handled via `localization.locale`**: Use a string like `'en_US'` for built-in languages.
- **Override specific menu items**: Use `operationMenu.items` for fine-grained control over text.
- **Disable default table handlers**: Use `toolbar.handlers.table: false` to prevent conflicts.

By following these steps, you can effectively integrate and localize the `quill-table-better` module in your Quill editor.
