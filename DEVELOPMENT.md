# 🛠 DEVELOPMENT.md (docpub Development Guide)

이 문서는 **docpub** 프로젝트의 로컬 개발 환경 설정, 코딩 컨벤션, 빌드 및 배포 프로세스를 상세히 안내합니다.

## 1. 개발 환경 설정 (Prerequisites)

프로젝트를 시작하기 전에 다음 도구들이 설치되어 있어야 합니다.

- **Node.js**: v18.x 이상 (LTS 권장)
- **Package Manager**: `npm` 또는 `pnpm` (속도와 효율성을 위해 `pnpm` 권장)
- **Redis**: 실시간 협업 세션 및 캐싱 (선택 사항)

## 2. 로컬 서버 실행 (Getting Started)

### 2.1 저장소 복제 및 의존성 설치

```bash
git clone https://github.com/doosik71/docpub.git
cd docpub
pnpm install
```

### 2.2 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 필요한 값을 입력합니다.

```bash
cp .env.example .env.local
```

- `DATABASE_URL`: PostgreSQL 접속 주소
- `NEXTAUTH_SECRET`: 보안 인증 키
- `OPENAI_API_KEY`: AI 기능 테스트용 API 키

### 2.3 데이터베이스 마이그레이션

```bash
pnpm prisma db push  # Prisma 사용 시
```

### 2.4 개발 서버 실행

```bash
pnpm dev
```

이제 `http://localhost:3000`에서 에디터를 확인할 수 있습니다.

---

## 3. 핵심 기술 구현 가이드

### 3.1 XML Schema & Tiptap Extension 매핑

`docpub`은 JATS XML 구조를 따르므로, 새로운 노드를 추가할 때는 `src/core/extensions` 내에 정의합니다.

```javascript
// 예시: JATS <sec> 태그 매핑 노드
import { Node } from "@tiptap/core";

export const Section = Node.create({
  name: "section",
  group: "block",
  content: "heading block*",
  parseHTML() {
    return [{ tag: "sec" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["sec", HTMLAttributes, 0];
  },
});
```

### 3.2 실시간 협업 (Hocuspocus 서버)

협업 서버는 `src/server/collaboration.ts`에 위치합니다. Yjs 업데이트를 수신하고 이를 XML로 변환하여 파일 시스템에 주기적으로 동기화하는 로직을 포함합니다.

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

에디터의 XML 파싱 및 변환 로직은 `Vitest`를 사용하여 검증합니다.

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

AI 관련 기능은 `src/ai/` 경로 내에서 관리합니다.

1. **Prompt Engineering**: 각 XML 노드에 최적화된 프롬프트를 구성합니다.
2. **Streaming**: 사용자 경험을 위해 `Vercel AI SDK`를 통한 스트리밍 응답을 기본으로 합니다.
3. **Safety**: 사용자 권한이 없는 문서 데이터가 AI 모델 학습에 사용되지 않도록 API 호출 시 옵션을 엄격히 관리합니다.

---

## 7. 도움말 및 문의

개발 중 문제가 발생하면 다음과 같은 경로를 이용해 주세요.

- **GitHub Issues**: 버그 보고 및 기능 제안
- **Discussions**: 기술적 구현 방식에 대한 토론
