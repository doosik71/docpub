'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Section from '@/core/extensions/section';

const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit, Section],
    content: `
      <sec>
        <h2>
          This is a Section
        </h2>
        <p>
          And this is the content within the section. This demonstrates the custom 'sec' tag mapping.
        </p>
      </sec>
      <p>
        This is content outside the section.
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
