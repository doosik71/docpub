'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';

import Section from '@/core/extensions/section';
import Figure from '@/core/extensions/figure';
import Figcaption from '@/core/extensions/figcaption';

const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Table,
      TableRow,
      TableHeader,
      TableCell,
      Section,
      Figure,
      Figcaption,
    ],
    content: `
      <sec>
        <h2>This is a Section</h2>
        <p>And this is the content within the section.</p>
        <figure>
          <img src="https://source.unsplash.com/random/800x400" alt="Random Unsplash Image" />
          <figcaption>This is a caption for the image above.</figcaption>
        </figure>
        <p>More content after the figure.</p>
        <table>
          <tbody>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
              <th>Header 3</th>
            </tr>
            <tr>
              <td>Row 1, Col 1</td>
              <td>Row 1, Col 2</td>
              <td>Row 1, Col 3</td>
            </tr>
            <tr>
              <td>Row 2, Col 1</td>
              <td>Row 2, Col 2</td>
              <td>Row 2, Col 3</td>
            </tr>
          </tbody>
        </table>
      </sec>
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
