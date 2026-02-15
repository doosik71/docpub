# 🏗 ARCHITECTURE.md (docpub Architecture)

이 문서는 **docpub**의 시스템 구조, 데이터 관리 전략 및 지능형 편집 워크플로우를 상세히 설명합니다.

## 1. 시스템 아키텍처 (System Layers)

`docpub`은 다음과 같은 5개의 핵심 레이어로 구성됩니다.

- **User & Auth Layer**: RBAC(역할 기반 접근 제어)를 통한 사용자 인증 및 세션 관리.
- **Storage Layer**: 계층적 폴더 구조와 **UUID 기반 .bin 파일**을 통한 문서 영속성 계층.
- **Version Control Layer**: 문서 수정 이력 관리 및 스냅샷 복구.
- **Editor Layer**: Tiptap 기반의 WYSIWYG 편집 및 스타일 엔진.
- **Collaboration & AI Layer**: Hocuspocus를 이용한 실시간 동기화 (각 **문서 UUID 별**), 그리고 LLM 기반 지능형 도구.

---

## 2. 상세 설계 (Detailed Components)

### 2.1 사용자 및 자산 관리 (User & File Management)

- **Account Management**: JWT(JSON Web Token) 기반 인증을 사용하며, 사용자는 개인 워크스페이스와 팀 공유 워크스페이스를 가집니다.
- **Folder/File Hierarchy**: 파일 시스템은 가상 디렉토리 구조를 지원합니다. 모든 폴더와 파일 정보는 메타데이터 DB(예: PostgreSQL)에서 관리되며, 실제 본문은 **UUID 기반 .bin 파일**로 파일 저장소에 저장됩니다. (XML -> Y.Doc Binary State)
- **Permission Control**: 각 문서/폴더별로 '소유자(Owner)', '편집자(Editor)', '조회자(Viewer)' 권한을 설정할 수 있습니다.

### 2.2 문서 버전 관리 (Version Control System)

- **Snapshotting**: 주요 변경 시점마다 문서의 **Y.Doc Binary State** 전체 상태를 스냅샷으로 저장합니다.
- **Time-travel Editing**: Yjs의 `Y.UndoManager`를 통해 실시간 편집 내역(Undo/Redo)을 추적하고, 특정 시점의 문서 상태로 롤백할 수 있는 기능을 제공합니다.
- **Binary Text Diff**: Y.Doc Binary State를 텍스트로 변환하여 버전 간 차이점(Diff)을 시각적으로 표시합니다.

### 2.3 스타일 편집 및 적용 (Styling Engine)

- **CSS Variable Themes**: 테마와 스타일 세트를 CSS 변수로 정의하여 문서 전체의 디자인을 일관되게 변경합니다.
- **DTP Layout Presets**: 사용자가 고정 레이아웃(A4, B5 등)과 흐름 레이아웃을 전환할 수 있도록 시트를 관리합니다.
- **Template Logic**: XML 태그와 CSS 클래스를 1:1로 매핑하여, 특정 스타일 가이드를 준수하도록 강제하는 템플릿 기능을 지원합니다.

### 2.4 검색 시스템 (Global & Local Search)

- **Full-text Search**: 저장된 **문서 제목 및 내용(Y.Doc State 변환)** 내에서 키워드를 검색합니다. (Elasticsearch 또는 인덱싱 엔진 연동 고려)
- **Semantic Search**: AI 벡터 임베딩을 활용하여 단어의 의미적 유사성을 바탕으로 문서를 검색하는 기능을 지원합니다.

### 2.5 AI 지능형 편집 (AI-Powered Editing)

- **Context-aware Assistance**: 현재 편집 중인 섹션의 **Y.Doc State** 구조와 상위 문맥을 LLM에 전달하여 가장 적절한 이어쓰기나 수정을 제안합니다.
- **Semantic Correction**: 단순 오타 교정을 넘어, 문맥에 어울리는 전문 용어 추천 및 문체 변경 기능을 제공합니다.
- **Action Command**: `/` 명령어를 통해 AI를 호출하고 요약, 번역, 표 데이터 생성 등의 작업을 트랜잭션 단위로 수행합니다.

---

## 3. 기술 스택 요약 (Refined Tech Stack)

| 구분          | 기술 스택                                       |
| ------------- | ----------------------------------------------- |
| **인증/계정** | NextAuth.js / Firebase Auth / JWT               |
| **파일/권한** | PostgreSQL (Metadata), S3/Local FS (**Y.Doc Binary State .bin 파일**)   |
| **버전 관리** | Yjs History + Custom Versioning Logic           |
| **스타일링**  | Tailwind CSS / CSS Modules / Paged.js (for PDF) |
| **검색**      | Meilisearch / Algolia (오픈 소스 대안) / **Y.Doc Contents Search**          |
| **AI 연동**   | OpenAI API / Google Gemini SDK / Vercel AI SDK  |

---

## 4. 데이터 흐름 (Data Life-cycle)

1. **사용자 접속**: 로그인 후 **URL 경로 (예: `/index` 또는 `/uuid`)** 에 따라 문서에 접근.
2. **문서 로드**: **URL의 UUID에 해당하는 .bin 파일**로부터 Y.Doc Binary State 로드 -> 클라이언트 에디터에 주입.
3. **편집 중**: 실시간 Yjs 동기화 (Hocuspocus) + 주기적인 자동 저장(**Y.Doc Binary State .bin 파일**로 저장).
4. **AI 요청**: 특정 텍스트 블록 선택 -> AI 엔진 전달 -> 결과 반영(Editor Transaction).
5. **버전 기록**: 사용자가 '배포' 또는 '저장' 클릭 시 스냅샷 버전 생성.
