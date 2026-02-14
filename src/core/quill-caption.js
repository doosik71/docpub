// src/core/quill-caption.js
import Quill from 'quill';

const Block = Quill.import('blots/block');

class CaptionBlot extends Block { }
CaptionBlot.blotName = 'caption';
CaptionBlot.tagName = 'figcaption'; // Use figcaption HTML tag
CaptionBlot.className = 'ql-caption'; // Optional: add a class for styling

Quill.register(CaptionBlot);

export default CaptionBlot;
