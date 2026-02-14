import { Node, mergeAttributes } from '@tiptap/core';

export const Figure = Node.create({
  name: 'figure',
  group: 'block',
  content: 'block+',
  draggable: true,

  parseHTML() {
    return [{ tag: 'figure' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes), 0];
  },
});

export default Figure;
