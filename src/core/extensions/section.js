import { Node } from '@tiptap/core';

/**
 * Represents a JATS <sec> tag.
 * A section must contain a heading followed by other block-level content.
 */
export const Section = Node.create({
  name: 'section',
  group: 'block',
  content: 'heading block*',

  parseHTML() {
    return [{ tag: 'sec' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['sec', HTMLAttributes, 0];
  },
});

export default Section;
