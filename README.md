# 📄 docpub (Open-source Collaborative XML DTP)

**docpub**는 단순한 마크다운의 한계를 넘어, 전문적인 출판(Desktop Publishing) 수준의 레이아웃과 실시간 협업을 지원하는 웹 기반 XML 워드 프로세서입니다.

---

## 🌟 프로젝트 개요

기존의 웹 편집기들은 마크다운의 단순함에 갇혀 있거나, 바이너리 형식의 폐쇄적인 구조를 가지고 있습니다. **docpub**은 복잡한 문서 구조를 반영할 수 있는 **표준 XML 기반의 텍스트 저장 방식**을 채택하면서도, 브라우저 환경에서 고수준의 시각적 편집과 **AI 및 동료와의 실시간 협업**을 가능하게 합니다.

## ✨ 주요 기능 (Key Features)

- **DTP 수준의 WYSIWYG 편집:** 다단 레이아웃, 복잡한 표(Table), 수식(), 정교한 이미지 배치 등 고해상도 출판물 수준의 서식을 지원합니다.
- **표준 XML 기반 아키텍처:** 문서의 모든 데이터를 구조화된 XML(JATS/DocBook 지향)로 관리하여 데이터 이식성과 기계 가독성을 극대화합니다.
- **실시간 동시 편집:** CRDT 알고리즘을 활용하여 여러 사용자가 충돌 없이 동일한 문서를 동시에 수정할 수 있습니다.
- **AI 협업 인터페이스:** LLM 연동을 통해 초안 작성, 요약, 문체 교정 등 지능형 문서 작성 보조 기능을 제공합니다.
- **권한 기반 공유:** 웹을 통해 특정 사용자에게 편집 또는 읽기 권한을 부여하고 세션별로 안전하게 관리합니다.
- **오픈 소스 확장성:** 누구나 플러그인을 개발하여 기능을 확장하거나 새로운 XML 스키마를 정의할 수 있습니다.

## 🛠 기술 스택 (Tech Stack)

- **Editor Engine:** [Tiptap](https://tiptap.dev/) (ProseMirror 기반의 구조화 편집 엔진)
- **Collaboration:** [Yjs](https://yjs.dev/) (실시간 동기화 라이브러리)
- **Frontend:** React / Vue.js (선택 가능)
- **Data Format:** Custom XML (JATS Standard Compatible)
- **Backend:** Node.js (Hocuspocus 기반 협업 서버)

## 🚀 시작하기 (Getting Started)

### 설치 방법

```bash
git clone https://github.com/doosik71/docpub.git
cd docpub
npm install
```

### 실행 방법

```bash
npm run dev
```

## 🗺 로드맵 (Roadmap)

- [ ] Core XML 스키마 정의 및 Tiptap 노드 매핑
- [ ] 실시간 협업을 위한 백엔드 소켓 서버 구축
- [ ] CSS 기반 고정 레이아웃(A4/Letter) 렌더링 엔진 개발
- [ ] AI 프롬프트 인터페이스 및 API 연동 모듈 추가
- [ ] PDF 및 EPUB 내보내기 기능 구현

## 🤝 기여 방법 (Contributing)

**docpub**은 오픈 소스 프로젝트입니다. 문서 구조 개선, 새로운 UI 컴포넌트 개발, AI 기능 강화 등 여러분의 모든 기여를 환영합니다!

1. Issue를 통해 개선 사항을 제안해 주세요.
2. Pull Request를 통해 코드를 제출해 주세요.

## 📄 라이선스 (License)

이 프로젝트는 **MIT 라이선스**를 따릅니다. 누구나 자유롭게 수정하고 배포할 수 있습니다.
