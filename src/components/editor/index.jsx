'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Quill from 'quill';
// import * as YQuill from 'y-quill';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import 'quill/dist/quill.snow.css';

const QuillEditor = () => {
  const [quillContainer, setQuillContainer] = useState(null);
  const quillToolbarRef = useRef(null);
  const [quill, setQuill] = useState(null);
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);

  const quillContainerCallbackRef = useCallback(node => {
    if (node !== null) {
      setQuillContainer(node);
    }
  }, []);

  useEffect(() => {
    let quillInstance;
    let newYdoc;
    let newProvider;
    let yQuillBinding;

    if (typeof window !== 'undefined' && quillContainer && !quill) {
      newYdoc = new Y.Doc();
      newProvider = new HocuspocusProvider({
        url: 'ws://127.0.0.1:1234',
        name: 'test-document',
        document: newYdoc,
      });

      quillInstance = new Quill(quillContainer, {
        theme: 'snow',
        modules: {
          toolbar: quillToolbarRef.current,
          history: {
            userOnly: true,
          },
        },
        placeholder: 'Start writing...',
      });

      const yQuillModule = require('y-quill');
      yQuillBinding = new yQuillModule.QuillBinding(newYdoc.getText('quill'), quillInstance);

      setYdoc(newYdoc);
      setProvider(newProvider);
      setQuill(quillInstance);
    }

    return () => {
      if (quillInstance) {
        quillInstance = null;
      }
      if (yQuillBinding) {
        yQuillBinding.destroy();
      }
      if (newProvider) {
        newProvider.destroy();
      }
    };
  }, [quillContainer]);

  // if (!quill) {
  //   return null;
  // }

  return (
    <div style={{ margin: '50px' }} className="flex flex-col h-full"> {/* Added flex-col h-full */}
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
      <div ref={quillContainerCallbackRef} className="flex-grow"></div> {/* Added flex-grow */}
    </div>
  );
};

export default QuillEditor;
