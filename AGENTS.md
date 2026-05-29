# haenaeyo-react Agent Guide

이 파일은 Codex와 기타 에이전트가 해내요 React 저장소에서 따라야 할 작업 계약이다.

## 작업 방식

- 변경 전 관련 화면, 타입, API client, 테스트를 먼저 읽는다.
- 기존 패턴을 우선하고, 새 추상화는 실제 중복이나 복잡도를 줄일 때만 만든다.
- 문서와 산출물은 한글로 작성한다.
- 명령어, 코드 식별자, 파일 경로, 라이브러리명은 원문을 유지한다.
- 사용자 요청 범위를 벗어난 리팩터링이나 디자인 변경은 하지 않는다.
- 비밀값, OAuth token, session cookie, OpenAI 관련 secret은 코드와 로그에 남기지 않는다.

## 구현 기준

- Vite + React + TypeScript 구조를 기본값으로 둔다.
- React Router `BrowserRouter`로 라우팅한다.
- 서버 상태는 TanStack Query로 관리한다.
- Zustand는 토스트, 인증 사용자, 생성 중 이동 차단 같은 전역 UI 상태에만 제한적으로 사용한다.
- Dialog, Tabs, Toast, Menu, Popover 등 상호작용 primitive는 Radix UI를 우선 사용한다.
- 아이콘은 `lucide-react`를 우선 사용한다.
- API 호출은 generated OpenAPI client를 통한다. 임시 fetch wrapper를 만들 때도 나중에 generated client로 치환하기 쉽게 경계를 둔다.

## UX 기준

- 반응형 웹 하나로 데스크탑과 모바일을 모두 지원한다.
- 데스크탑은 좌측 사이드바, 모바일은 하단 탭바를 사용한다.
- 빈 상태는 단순 안내 문구와 필요한 CTA만 표시한다.
- 페이지 최초 로딩은 실제 레이아웃 형태의 skeleton을 사용한다.
- 생성 중 이동 차단, 에러 유지, undo 가능 토스트 정책을 지킨다.
- Todo 체크 같은 일상 피드백은 토스트 없이 시각 상태만 변경한다.

## 검증 명령

package script가 존재하면 다음 순서로 실행한다.

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Playwright가 설정된 뒤에는 핵심 사용자 흐름만 E2E로 검증한다.

## 자동 Git 마무리

사용자가 명시적으로 "커밋하지 마", "푸시하지 마", "PR 만들지 마"라고 제한하지 않으면 작업 완료 후 PR까지 진행한다.

기본 명령:

```bash
scripts/codex-pr feature/api-build "feat: API 빌드 자동화"
```

규칙:

- 브랜치는 `feature/api-build`, `fix/login-error`, `chore/dependency-update`처럼 `작업유형/작업내용` 형식으로 만든다.
- 커밋 메시지는 `feat: 사용자 프로필 API 추가`처럼 prefix를 필수로 쓰고, prefix 뒤 설명은 한글로 작성한다.
- PR은 항상 만든 브랜치에서 `main`으로 생성한다.
- `main`에는 직접 커밋하지 않는다.
- 검증 실패가 있으면 커밋/푸시/PR 전에 수정하거나, 수정 불가 사유를 남기고 멈춘다.
- 외부 권한 승인이나 GitHub 인증이 필요해 자동 수행이 막히면 필요한 승인만 요청한다.

## 리뷰 체크리스트

- 화면이 제품 문서의 MVP 범위를 벗어나지 않는가.
- 모바일/데스크탑에서 텍스트 겹침과 레이아웃 흔들림이 없는가.
- 생성 중 이동 차단과 실패 시 기존 데이터 유지가 지켜지는가.
- API 에러의 `code`, `message`, `details` 처리가 일관적인가.
- raw HTML 없는 Markdown 렌더링과 링크 scheme 제한이 지켜지는가.
- 테스트가 실제 사용자 위험을 검증하는가.

## 인수인계 형식

```text
작업:
맥락:
변경 파일:
실행한 명령:
결과:
남은 위험:
다음 추천:
```
