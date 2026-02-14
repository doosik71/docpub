# 🗺️ ROADMAP.md (docpub Development Roadmap)

`docpub` 프로젝트의 개발 단계와 향후 비전을 설명합니다. 본 프로젝트는 총 4단계의 마일스톤을 거쳐 완성됩니다.

## Phase 1: 기반 구축 (Foundational Setup) - **진행 중**

프로젝트의 핵심 엔진과 기본적인 편집 환경을 구축합니다.

- [ ] 프로젝트 스택 초기화 (Next.js, Tiptap, Tailwind CSS)
- [ ] 핵심 XML 스키마 정의 (JATS 호환) 및 Tiptap 노드 매핑
- [ ] 기본 위지윅(WYSIWYG) 편집 기능 구현 (텍스트, 제목, 리스트)
- [ ] 사용자 인증(Auth) 및 기본적인 폴더/파일 관리 UI 개발

## Phase 2: 협업 및 버전 관리 (Collaboration & Sync)

실시간으로 함께 쓰고, 변화를 추적하는 기능을 구현합니다.

- [ ] Yjs 기반 실시간 동시 편집 서버(Hocuspocus) 연동
- [ ] 사용자 커서 위치 표시 및 편집 권한(RBAC) 시스템 적용
- [ ] XML 텍스트 기반의 문서 자동 저장 및 스냅샷 버전 관리 시스템
- [ ] 문서 내 로컬 검색 및 전역 키워드 검색 엔진 구축

## Phase 3: DTP 레이아웃 및 스타일 (Advanced DTP & Styling)

마크다운을 넘어선 고수준의 서식 기능을 완성합니다.

- [ ] CSS Paged Media를 활용한 페이지 기반 레이아웃(A4/Letter) 렌더링
- [ ] 복잡한 표(Table) 편집기 및 수식() 지원 확장 도구
- [ ] 문서 스타일 테마 시스템 (사용자 정의 CSS 변수 적용)
- [ ] 인쇄 미리보기 및 다단 레이아웃 제어 기능

## Phase 4: AI 지능형 편집 및 배포 (AI Integration & Export)

AI 협업과 최종 출판 기능을 고도화합니다.

- [ ] LLM 기반 Context-aware 편집 보조 도구(자동 완성, 문체 변경) 연동
- [ ] AI를 활용한 시맨틱 검색 및 문서 자동 요약 기능
- [ ] 멀티 포맷 출력 엔진 (PDF, EPUB, Clean XML) 완성
- [ ] 플러그인 SDK 공개 및 서드파티 개발자 생태계 구축

---

## 📈 향후 비전

`docpub`은 단순히 글을 쓰는 도구를 넘어, 지식의 구조화와 아름다운 출판 과정을 AI와 함께 혁신하는 플랫폼을 꿈꿉니다. 텍스트 데이터가 가장 가치 있게 관리되는 환경을 제공하겠습니다.
