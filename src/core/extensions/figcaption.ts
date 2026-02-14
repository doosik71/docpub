import { Node, mergeAttributes } from '@tiptap/core';

export const Figcaption = Node.create({
  name: 'figcaption',
  group: 'block',
  content: 'text*',
  
  parseHTML() {
    return [{ tag: 'figcaption' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figcaption', mergeAttributes(HTMLAttributes), 0];
  },
});

export default Figcaption;
