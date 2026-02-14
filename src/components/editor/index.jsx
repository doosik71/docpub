'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Quill from 'quill';
// import * as YQuill from 'y-quill'; // Temporarily commented out
import * as Y from 'yjs'; // Re-enabled
import { HocuspocusProvider } from '@hocuspocus/provider'; // Re-enabled
import 'quill/dist/quill.snow.css'; // Import Quill's CSS

const QuillEditor = () => {
  // console.log("QuillEditor rendering..."); // Removed debug log

  const [quillContainer, setQuillContainer] = useState(null);
  const quillToolbarRef = useRef(null); // Ref for the toolbar
  const [quill, setQuill] = useState(null);
  const [ydoc, setYdoc] = useState(null); // Re-enabled
  const [provider, setProvider] = useState(null); // Re-enabled

  // Callback ref for the Quill container
  const quillContainerCallbackRef = useCallback(node => {
    // console.log("Callback ref fired. node:", node); // Removed debug log
    if (node !== null) {
      setQuillContainer(node);
    }
  }, []);

  useEffect(() => {
    let quillInstance;
    let newYdoc;
    let newProvider;
    let yQuillBinding;

    // console.log("useEffect running. quillContainer:", quillContainer); // Removed debug log

    // Ensure Quill initializes only on the client-side and container is available
    if (typeof window !== 'undefined' && quillContainer && !quill) {
      // console.log("Initializing Quill on container:", quillContainer); // Removed debug log

      newYdoc = new Y.Doc(); // Re-enabled
      newProvider = new HocuspocusProvider({ // Re-enabled
        url: 'ws://127.0.0.1:1234', // Re-enabled
        name: 'test-document', // Re-enabled
        document: newYdoc, // Re-enabled
      }); // Re-enabled

      quillInstance = new Quill(quillContainer, { // Use quillContainer directly
        theme: 'snow', // Use 'snow' theme for a basic editor with toolbar
        modules: {
          toolbar: quillToolbarRef.current, // Link the toolbar module to the ref
          history: {
            userOnly: true,
          },
        },
        placeholder: 'Start writing...',
      });
      // console.log("Quill instance created:", quillInstance); // Removed debug log

      // Use require() for y-quill here
      const yQuillModule = require('y-quill'); // Dynamically require y-quill
      // Corrected: use `new` keyword for QuillBinding class constructor
      yQuillBinding = new yQuillModule.QuillBinding(newYdoc.getText('quill'), quillInstance);

      setYdoc(newYdoc); // Re-enabled
      setProvider(newProvider); // Re-enabled
      setQuill(quillInstance);
    }

    return () => {
      if (quillInstance) {
        quillInstance = null;
      }
      if (yQuillBinding) { // Re-enabled cleanup
        yQuillBinding.destroy(); // Re-enabled cleanup
      } // Re-enabled cleanup
      if (newProvider) { // Re-enabled cleanup
        newProvider.destroy(); // Re-enabled cleanup
      } // Re-enabled cleanup
    };
  }, [quillContainer]); // Dependency array: runs when quillContainer becomes available

  // if (!quill) { // Reinstated loading state
  //   return null;
  // }

  return (
    <div style={{ margin: '50px' }}>
      {/* Toolbar div */}
      <div ref={quillToolbarRef}>
        <button className="ql-bold"></button>
        <button className="ql-italic"></button>
        <button className="ql-underline"></button>
        <select className="ql-header">
          <option value="1"></option>
          <option value="2"></option>
          <option value=""></option>
        </select>
        <button className="ql-list" value="ordered"></button>
        <button className="ql-list" value="bullet"></button>
        <button className="ql-blockquote"></button>
        <button className="ql-code-block"></button>
        <button className="ql-link"></button>
        <button className="ql-image"></button>
      </div>
      {/* Editor content area */}
      <div ref={quillContainerCallbackRef}></div> {/* Use callback ref here */}
    </div>
  );
};

export default QuillEditor;
