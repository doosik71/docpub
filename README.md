# 📄 Marco (Open-source Collaborative Document Editor)

**Marco**는 마크다운 수준의 레이아웃과 실시간 협업을 지원하는 웹 기반 문서 편집기입니다.

---

## 🌟 프로젝트 개요

기존의 웹 편집기들은 마크다운의 단순함에 갇혀 있거나, 바이너리 형식의 폐쇄적인 구조를 가지고 있습니다. **Marco**은 복잡한 문서 구조를 반영할 수 있는 **Y.Doc Binary State 기반의 .bin 파일 저장 방식**을 채택하면서도, 브라우저 환경에서 고수준의 시각적 편집과 **AI 및 동료와의 실시간 협업**을 가능하게 합니다.

## ✨ 주요 기능 (Key Features)

- **WYSIWYG 편집:** **Quill Editor**를 통해 이미지, 표(Table), 수식(LaTeX) 등 서식 및 다단 레이아웃을 지원합니다.
- **Y.Doc Binary State 기반 아키텍처:** 문서의 모든 데이터를 **Yjs Y.Doc Binary State (.bin 파일)** 형태로 관리하여 데이터 이식성과 실시간 동기화 효율성을 극대화합니다.
- **실시간 동시 편집:** CRDT 알고리즘(Yjs)과 Hocuspocus 서버를 활용하여 여러 사용자가 충돌 없이 동일한 문서를 동시에 수정할 수 있습니다.
- **동적 URL 라우팅:** 각 문서에 고유한 URL(/doc/doc-id)을 부여하여 직접 접근 및 공유가 가능합니다.
- **문서 검색:** 문서 제목 및 내용(Full-text) 기반의 검색 기능을 제공합니다.
- **AI 협업 인터페이스:** Google Gemini 연동을 통해 초안 작성, 요약, 문체 교정 등 지능형 문서 작성 보조 기능을 제공합니다.
- **권한 기반 공유:** 웹을 통해 특정 사용자에게 편집 또는 읽기 권한을 부여하고 세션별로 안전하게 관리합니다.
- **오픈 소스 확장성:** 누구나 플러그인을 개발하여 기능을 확장하거나 새로운 스키마를 정의할 수 있습니다.
- **목차 표시 기능:** 문서 로드 시 자동으로 목차를 생성하여 탐색 편의성을 제공합니다.
- **마크다운 내보내기:** 작성된 문서를 마크다운 형식으로 내보낼 수 있습니다.
- **수식(LaTeX) 편집:** LaTeX 문법을 사용하여 수식을 작성하고 렌더링할 수 있습니다.
- **테마 시스템:** CSS 변수를 통해 문서의 스타일 테마를 유연하게 변경할 수 있습니다.

## 🛠 기술 스택 (Tech Stack)

- **Frontend Framework:** Next.js (React 기반)
- **Editor Engine:** Quill Editor (Y.js 바인딩 포함)
- **Collaboration Core:** Yjs (실시간 동기화 라이브러리)
- **Collaboration Server:** Hocuspocus (WebSocket 기반) + Express.js (API Gateway)
- **Data Format:** Y.Doc Binary State (.bin files)
- **Backend:** Node.js

## 🚀 시작하기 (Getting Started)

### 설치 방법

```bash
git clone https://github.com/doosik71/marco.git
cd marco
pnpm install # 또는 npm install
```

### 실행 방법

```bash
pnpm dev # Next.js 개발 서버 (프론트엔드 및 API 라우트)
npm run server # Hocuspocus 협업 서버 및 Express API (src/server/collaboration.js)
```

이제 `http://localhost:3000`에서 에디터를 확인할 수 있습니다.

## 🗺 로드맵 (Roadmap)

자세한 로드맵은 [ROADMAP.md](ROADMAP.md) 파일을 참조해주세요.

## 🤝 기여 방법 (Contributing)

**Marco**은 오픈 소스 프로젝트입니다. 문서 구조 개선, 새로운 UI 컴포넌트 개발, AI 기능 강화 등 여러분의 모든 기여를 환영합니다!

1. Issue를 통해 개선 사항을 제안해 주세요.
2. Pull Request를 통해 코드를 제출해 주세요.

## 📄 라이선스 (License)

이 프로젝트는 **MIT 라이선스**를 따릅니다. 누구나 자유롭게 수정하고 배포할 수 있습니다.
