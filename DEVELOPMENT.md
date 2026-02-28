# 🛠 DEVELOPMENT.md (Marco Development Guide)

이 문서는 **Marco** 프로젝트의 로컬 개발 환경 설정, 코딩 컨벤션, 빌드 및 배포 프로세스를 상세히 안내합니다.

## 1. 개발 환경 설정 (Prerequisites)

프로젝트를 시작하기 전에 다음 도구들이 설치되어 있어야 합니다.

- **Node.js**: v18.x 이상 (LTS 권장)
- **Package Manager**: `npm` 또는 `pnpm` (속도와 효율성을 위해 `pnpm` 권장)
- **Hocuspocus Server**: 실시간 협업 서버 (자동으로 시작됨)

## 2. 로컬 서버 실행 (Getting Started)

### 2.1 저장소 복제 및 의존성 설치

```bash
git clone https://github.com/doosik71/marco.git
cd marco
pnpm install
```

### 2.2 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 필요한 값을 입력합니다.

```bash
cp .env.example .env.local
```

- `GEMINI_API_KEY`: AI 기능 테스트용 API 키

### 2.3 개발 서버 실행

`Marco`은 프론트엔드(Next.js), Hocuspocus 협업 서버, 그리고 Express 기반 문서 API 서버로 구성됩니다.

```bash
pnpm dev # Next.js 개발 서버 (프론트엔드 및 API 라우트)
npm run server # Hocuspocus 협업 서버 및 Express API (src/server/collaboration.js)
```

이제 `http://localhost:3000`에서 에디터를 확인할 수 있습니다.

---

## 3. 핵심 기술 구현 가이드

### 3.1 Quill Editor 및 Y.Doc 구조

`Marco`은 Quill Editor를 사용하여 WYSIWYG 편집을 제공하며, 모든 문서 상태는 Yjs의 `Y.Doc` 형태로 관리됩니다. Y.Doc은 Quill Editor와 `y-quill` 바인딩을 통해 실시간으로 동기화됩니다.

```javascript
// 예시: Y.Doc에서 Quill 델타 접근
const ydoc = editorRef.current.getYdoc();
const quillContent = ydoc.getText("quill"); // Quill 델타 데이터
```

### 3.2 실시간 협업 (Hocuspocus 서버)

Hocuspocus 서버는 `src/server/collaboration.js`에 위치합니다. 클라이언트로부터 Yjs 업데이트를 수신하고, 이를 **ID 기반 .bin 파일**로 파일 시스템에 주기적으로 영속화하는 로직을 포함합니다. 최근 Hocuspocus 통합이 리팩토링되었으며, 문서 라우팅 방식이 개선되어 더욱 견고한 협업 환경을 제공합니다. 또한, 문서 API (`/api/documents`)를 호스팅하여 문서 목록 조회, 특정 문서 로드 및 저장 기능을 제공합니다.

---

## 4. 코딩 컨벤션 및 워크플로우

### 4.1 브랜치 전략

- **main**: 상용 배포 가능한 안정적인 코드.
- **develop**: 다음 버전을 위한 통합 개발 브랜치.
- **feature/기능명**: 개별 기능 개발용 브랜치.

### 4.2 커밋 메시지 규칙 (Conventional Commits)

- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `docs:` 문서 수정
- `refactor:` 코드 리팩토링
- `style:` 코드 의미에 영향을 주지 않는 변경 (포맷팅 등)

## 5. 테스트 및 빌드 (Testing & Build)

### 5.1 유닛 테스트

에디터의 **Quill 델타 및 Y.Doc 변환** 로직은 `Vitest`를 사용하여 검증합니다.

```bash
pnpm test
```

### 5.2 프로덕션 빌드

```bash
pnpm build
pnpm start
```

---

## 6. AI 기능 개발 지침

AI 관련 기능은 `src/ai/` 경로 내에서 관리합니다. 특히 Google Gemini AI 모델과의 통합에 중점을 둡니다.

1. **Prompt Engineering**: 각 **Y.Doc 노드**에 최적화된 프롬프트를 구성하며, Gemini 모델의 특성을 고려합니다.
2. **Streaming**: 사용자 경험을 위해 스트리밍 응답을 기본으로 하며, Gemini API의 스트리밍 기능을 활용합니다.
3. **Safety**: 사용자 권한이 없는 문서 데이터가 AI 모델 학습에 사용되지 않도록 API 호출 시 옵션을 엄격히 관리합니다.

---

## 7. 도움말 및 문의

개발 중 문제가 발생하면 다음과 같은 경로를 이용해 주세요.

- **GitHub Issues**: 버그 보고 및 기능 제안
- **Discussions**: 기술적 구현 방식에 대한 토론
