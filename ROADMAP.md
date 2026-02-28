# 🗺️ ROADMAP.md (Marco Development Roadmap)

`Marco` 프로젝트의 개발 단계와 향후 비전을 설명합니다. 본 프로젝트는 총 4단계의 마일스톤을 거쳐 완성됩니다.

## Phase 1: 기반 구축 (Foundational Setup)

프로젝트의 핵심 엔진과 기본적인 편집 환경을 구축합니다.

- [x] 프로젝트 스택 초기화 (Next.js, Quill.js, Tailwind CSS)
- [x] Core Y.Doc 스키마 정의 및 Quill 확장 매핑 (Quill 캡션 등 기본 기능)
- [x] 기본적인 위지윅(WYSIWYG) 편집 기능 구현 (텍스트, 제목, 리스트)
- [x] 사용자 정의 ID 기반 동적 URL 라우팅 및 파일 관리 UI 개발

## Phase 2: 협업 및 버전 관리 (Collaboration & Sync)

실시간으로 함께 쓰고, 변화를 추적하는 기능을 구현합니다.

- [x] Yjs 기반 실시간 동시 편집 서버(Hocuspocus) 연동
- [x] ID 기반 .bin 파일 자동 저장
- [x] 문서 제목 및 내용 기반 검색 기능 구현
- [x] 문서 라우팅 구조 개선 및 서버 측 협업 로직 리팩토링

## Phase 3: 레이아웃 및 스타일 (Layout & Styling)

- [x] 문서 스타일 테마 시스템 (사용자 정의 CSS 변수 적용)
- [x] 수식(LaTeX) 편집 기능 구현
- [x] 인쇄 미리보기 최적화 (UI 요소 숨김, 여백 조정)

## Phase 4: AI 지능형 편집 및 배포 (AI Integration & Export)

- [x] LLM 기반 Context-aware 편집 보조 기능 (초안 작성, 요약, 문체 교정)
- [x] AI 프롬프트 인터페이스 및 API 연동 모듈 추가
- [x] 목차 표시 기능 구현
- [x] 마크다운(.md) 형식으로 문서 내보내기 기능 구현

## Phase 5: 추가 기능

- [ ] 수식 편집 기능
- [ ] PDF 변환 중 수학 공식 렌더링 문제 해결 필요
- [ ] 복잡한 표(Table) 편집 기능 고도화
- [ ] 플러그인 SDK 공개 및 서드파티 개발자 생태계 구축

---

## 📈 향후 비전

`Marco`은 단순히 글을 쓰는 도구를 넘어, 지식의 구조화로 AI와 함께 혁신하는 플랫폼을 꿈꿉니다. 텍스트 데이터가 가장 가치 있게 관리되는 환경을 제공하겠습니다.
