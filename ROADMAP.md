# 🗺️ ROADMAP.md (docpub Development Roadmap)

`docpub` 프로젝트의 개발 단계와 향후 비전을 설명합니다. 본 프로젝트는 총 4단계의 마일스톤을 거쳐 완성됩니다.

## Phase 1: 기반 구축 (Foundational Setup) - **진행 중**

프로젝트의 핵심 엔진과 기본적인 편집 환경을 구축합니다.

- [x] 프로젝트 스택 초기화 (Next.js, Quill.js, Tailwind CSS)
- [x] Core Y.Doc 스키마 정의 및 Quill 확장 매핑 (Quill 캡션 등 기본 기능)
- [x] 기본적인 위지윅(WYSIWYG) 편집 기능 구현 (텍스트, 제목, 리스트)
- [x] **UUID 기반 동적 URL 라우팅 및 파일 관리 UI 개발**
- [ ] 사용자 인증(Auth) 시스템 개발

## Phase 2: 협업 및 버전 관리 (Collaboration & Sync) - **완료**

실시간으로 함께 쓰고, 변화를 추적하는 기능을 구현합니다.

- [x] Yjs 기반 실시간 동시 편집 서버(Hocuspocus) 연동
- [x] **UUID 기반 .bin 파일 자동 저장 및 스냅샷 버전 관리 시스템**
- [x] **문서 제목 및 내용 기반 통합 검색 기능 구현**
- [ ] 사용자 커서 위치 표시 및 편집 권한(RBAC) 시스템 적용 (데이터 로깅 완료, 시각화 진행 중)

## Phase 3: DTP 레이아웃 및 스타일 (Advanced DTP & Styling) - **계획 중**

마크다운을 넘어선 고수준의 서식 기능을 완성합니다.

- [ ] CSS Paged Media를 활용한 페이지 기반 레이아웃(A4/Letter) 렌더링
- [ ] 복잡한 표(Table) 편집기 및 수식(LaTeX) 지원 확장 도구
- [ ] 문서 스타일 테마 시스템 (사용자 정의 CSS 변수 적용)
- [ ] 인쇄 미리보기 및 다단 레이아웃 제어 기능

## Phase 4: AI 지능형 편집 및 배포 (AI Integration & Export) - **계획 중**

AI 협업과 최종 출판 기능을 고도화합니다.

- [ ] LLM 기반 Context-aware 편집 보조 도구(자동 완성, 문체 변경) 연동
- [ ] AI를 활용한 시맨틱 검색 및 문서 자동 요약 기능
- [ ] 멀티 포맷 출력 엔진 (PDF, EPUB, Clean XML) 완성
- [ ] 플러그인 SDK 공개 및 서드파티 개발자 생태계 구축

---

## 📈 향후 비전

`docpub`은 단순히 글을 쓰는 도구를 넘어, 지식의 구조화와 아름다운 출판 과정을 AI와 함께 혁신하는 플랫폼을 꿈꿉니다. 텍스트 데이터가 가장 가치 있게 관리되는 환경을 제공하겠습니다.
