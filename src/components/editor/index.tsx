'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: `
      <h2>
        Welcome to docpub!
      </h2>
      <p>
        This is a basic Tiptap editor setup. Start typing here...
      </p>
    `,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
      },
    },
  });

  return <EditorContent editor={editor} />;
};

export default TiptapEditor;
