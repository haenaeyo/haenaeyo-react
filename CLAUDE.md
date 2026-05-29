# haenaeyo-react Claude Guide

이 저장소는 해내요 1차 MVP의 React 프론트엔드 저장소다. 상위 작업공간의 `docs/architecture.md`, `docs/product-technical-decisions.md`, ADR을 제품/기술 기준으로 삼되, 이 파일은 프론트엔드 작업 시 즉시 따라야 할 실행 규칙을 정의한다.

## 기본 원칙

- 문서와 에이전트 산출물은 한글로 작성한다. 명령어, 코드 식별자, 파일 경로, 라이브러리명은 원문을 유지한다.
- 1차 MVP는 반응형 웹 하나로 제공한다. 네이티브 앱과 알림은 범위 밖이다.
- 로그인 후 진입점은 `오늘` 화면이다. 비로그인 사용자는 랜딩에서 시작해 로그인으로 이동한다.
- 프론트 검증은 UX 보조용이며, 백엔드가 최종 검증을 담당한다.
- OpenAI API key, OAuth secret, session secret은 프론트 코드나 로그에 절대 노출하지 않는다.

## 기술 스택

- Vite, React, TypeScript.
- Routing: React Router `BrowserRouter`.
- Server state: TanStack Query.
- Global UI state: Zustand는 토스트, 인증 사용자, 생성 중 이동 차단 같은 UI 상태에만 제한적으로 사용한다.
- Styling: Tailwind CSS.
- Interaction primitive: Dialog, Tabs, Toast, Menu, Popover 등은 Radix UI를 우선 사용한다.
- Icons: `lucide-react`.
- API client/type은 Springdoc OpenAPI에서 생성된 TypeScript client를 사용한다.
- Tests: Vitest, React Testing Library, Playwright.

## 화면 범위

1차 MVP 포함 화면:

- 랜딩.
- 로그인.
- 오늘.
- 목표 생성.
- AI 계획 생성 결과.
- 목표 상세.
- 계획 상세 보기.
- 목표 목록.
- 캘린더.
- 마이페이지.

글로벌 네비게이션:

- 데스크탑: 좌측 사이드바.
- 모바일: 하단 탭바.
- 메뉴: 오늘 / 목표 / 캘린더 / 마이페이지. 모바일에서는 마이페이지를 `마이`로 축약할 수 있다.

## UI 규칙

- 디자인 토큰은 제품 문서의 색상, 타이포그래피, 간격, radius 기준을 따른다.
- 간격은 4의 배수만 사용한다.
- 카드 radius는 기본 8px 이하로 유지한다. 모달/시트는 12px까지 허용한다.
- 빈 상태는 단순 안내 문구 중심으로 만들고, 별도 일러스트는 넣지 않는다.
- 버튼에는 가능한 경우 `lucide-react` 아이콘을 사용한다.
- DatePicker는 native `<input type="date">`를 사용한다.
- 캘린더 월 뷰는 직접 구현한다.
- 마크다운 렌더링은 raw HTML을 허용하지 않는다.
- 링크 scheme은 `http`, `https`, `mailto` 정도만 허용한다.
- 텍스트가 모바일/데스크탑에서 부모 영역을 넘치거나 겹치지 않게 확인한다.

## AI 생성 UX

- 계획 생성, 자료 생성, 재계획, 자료 재요청은 모두 SSE 스트리밍 UX를 사용한다.
- 생성 중에는 화면 이동을 차단한다.
- 이동 시도 시 생성 취소 확인 모달을 표시한다.
- 계획 생성과 재계획은 Day 단위 카드가 순차적으로 추가되는 형태를 기본으로 한다.
- AI 자료 재요청은 기존 자료를 유지한 채 preview를 생성하고, 적용 전까지 현재 자료를 바꾸지 않는다.
- 실패 시 기존 데이터는 유지하고 인라인 에러 또는 실패 안내를 표시한다.

## API와 상태

- 성공 응답은 envelope 없는 순수 data로 가정한다.
- 에러 응답은 `{ code, message, details }` 공통 포맷을 사용한다.
- 서버 오류/페이지 로딩 실패에만 trace id를 작게 표시한다.
- 일반 입력 오류에는 trace id를 표시하지 않는다.
- 토스트는 동시에 1개만 표시하고 3초 후 자동 소멸한다.
- 일상적인 Todo 체크는 토스트 없이 시각 상태만 변경한다.

## 테스트와 검증

프로젝트가 scaffold된 뒤 package script가 있으면 다음을 우선 사용한다.

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

핵심 테스트 대상:

- 목표 생성 입력 흐름.
- AI 계획 mock streaming 표시.
- 생성 결과 Todo 수정.
- 계획 확정 후 오늘/목표 상세/캘린더 반영.
- Todo 완료와 선택 피드백.
- 재계획 mock 적용.

## 문서 갱신

- 화면/상태/API 계약이 바뀌면 관련 README 또는 docs 메모를 갱신한다.
- 구현되지 않은 기능을 완료된 것처럼 쓰지 않는다.
- ADR은 되돌리기 어려운 기술 결정이 생겼을 때만 추가한다.
