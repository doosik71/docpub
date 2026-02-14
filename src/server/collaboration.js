import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import * as path from 'path';
import * as fs from 'fs';

const server = new Server({
  port: 1234, // Hocuspocus 서버 포트

  async onLoadDocument(data) {
    const documentId = data.documentName;
    const filePath = path.join(__dirname, `../../documents/${documentId}.xml`);
    const ydoc = new Y.Doc();

    // 문서 파일이 존재하면 불러오기 (초기 로딩 시에는 빈 Y.Doc을 반환하고, Tiptap이 콘텐츠 주입하도록 함)
    // Tiptap Collaboration 확장 기본 동작에 의존하여 클라이언트가 Y.Doc을 채우도록 함
    if (fs.existsSync(filePath)) {
      console.log(`Loading document: ${documentId} from ${filePath} (content will be filled by client)`);
      // Hocuspocus는 Yjs binary format을 로드하는 것이 일반적이지만,
      // 현재는 XML string을 사용하므로, 복잡한 서버측 XML -> Yjs 변환은 일단 생략.
      // 클라이언트가 Y.Doc에 초기 콘텐츠를 주입하거나,
      // HocuspocusProvider의 'content' 옵션을 통해 초기화할 수 있음.
    } else {
      console.log(`Document not found, creating new: ${documentId}`);
    }

    return ydoc; // 빈 Y.Doc 반환
  },

  async onStoreDocument(data) {
    const documentId = data.documentName;
    const filePath = path.join(__dirname, `../../documents/${documentId}.xml`);

    const yXmlFragment = data.document.getXmlFragment('prosemirror');
    let xmlContent = '<p></p>'; // 기본값: 비어 있는 Tiptap 문서의 XML

    if (yXmlFragment && yXmlFragment.length > 0) {
      xmlContent = yXmlFragment.toString();
    } else {
      console.warn(`[onStoreDocument] 'prosemirror' fragment is empty or null for document: ${documentId}. Storing default empty content.`);
    }

    fs.writeFileSync(filePath, xmlContent, 'utf8');
    console.log(`Storing document: ${documentId} to ${filePath}`);
  },

  onConnect() {
    console.log('Client connected.');
  },

  onDisconnect() {
    console.log('Client disconnected.');
  },
});

server.listen();
console.log('Hocuspocus server listening on port 1234');
