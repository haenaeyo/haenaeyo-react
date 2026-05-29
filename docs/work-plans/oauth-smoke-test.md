# 작업 계획서: OAuth 간단 테스트

## 요청

`haenaeyo-backend`의 OAuth를 보고 간단하게 OAuth를 테스트할 수 있는 구현을 `haenaeyo-react`에 추가한다.

## 가정

- `haenaeyo-react`에는 아직 실제 React 앱 소스가 없으므로 최소 Vite + React + TypeScript 구조를 새로 만든다.
- OAuth smoke test는 정식 로그인 UX가 아니라 개발자가 provider callback, session 생성, session 조회, logout을 빠르게 확인하는 도구다.
- OAuth 사용자 영속화 adapter는 아직 연결 전이므로 성공 기준은 Spring Security OAuth2 Login session 동작 확인까지로 둔다.
- OAuth client secret, OAuth token, session cookie 값은 코드, 문서, UI, 로그에 남기지 않는다.

## 범위

포함:

- 백엔드 `GET /api/auth/me` 인증 세션 요약 API 추가.
- 프론트 OAuth smoke test 화면 추가.
- Vite dev server proxy로 `/api`, `/oauth2`, `/login`을 `http://localhost:8080`에 연결.
- 백엔드/프론트 기본 검증 명령 실행.

제외:

- 정식 로그인/회원가입 UX.
- OAuth 사용자 영속화 adapter 구현.
- 운영 배포 설정 변경.
- OAuth provider client secret 발급 또는 저장.

## 계획

1. 백엔드에 `/api/auth/me` 추가 -> 검증: 인증 없이는 401, 인증 후에는 safe summary JSON만 반환한다.
2. 백엔드 테스트 추가 -> 검증: unauthenticated, Spring OAuth2 principal, `HaenaeyoPrincipal` 케이스를 MockMvc로 확인한다.
3. 프론트 최소 Vite 앱 생성 -> 검증: `Google 로그인`, `GitHub 로그인`, `내 세션 확인`, `로그아웃` 조작이 화면에 존재한다.
4. Vite proxy 설정 -> 검증: 브라우저 origin은 `localhost:5173`이고 `/api`, `/oauth2`, `/login` 요청은 backend `localhost:8080`으로 전달된다.
5. 로컬 실제 OAuth smoke test -> 검증: backend를 `prod` profile로 실행하고 provider redirect URI를 `http://localhost:5173/login/oauth2/code/{provider}`로 등록한 뒤 로그인, 세션 조회, 로그아웃을 수동 확인한다.

## 아키텍처 메모

- 컨텍스트: `local` profile은 `/api/**`에 test principal을 자동 주입하므로 실제 provider OAuth 검증에는 `prod` profile을 사용한다.
- 의존성 규칙: 인증 상태 요약은 identity web adapter 안에 두고 domain/application port에는 영향을 주지 않는다.
- 데이터/API 계약 영향: `GET /api/auth/me`는 `authenticated`, `principalType`, `name`, `email`, `displayName`, `provider`만 반환한다.
- 보안: raw OAuth attributes, OAuth token, session cookie, client secret은 반환하지 않는다.

## 테스트

- Unit: 별도 순수 함수가 없으므로 생략.
- Integration: `AuthMeControllerTest`로 인증 전 401과 인증 후 safe summary 응답을 검증한다.
- ArchUnit: 기존 헥사고날 의존성 테스트를 유지한다.
- Frontend: `npm run typecheck`, `npm run lint`, `npm run build`.
- E2E: 브라우저에서 provider 로그인 버튼, `/api/auth/me` 조회, `/api/logout` 후 재조회 수동 검증.

## 인수인계

```text
작업:
OAuth smoke test용 backend session summary API와 frontend test 화면 구현.
맥락:
Spring Security OAuth2 Login 기반은 존재하지만 사용자 영속화 adapter는 아직 연결 전이다.
변경 파일:
haenaeyo-backend/src/main/kotlin/com/haenaeyo/backend/identity/adapter/in/web/AuthMeController.kt
haenaeyo-backend/src/test/kotlin/com/haenaeyo/backend/identity/adapter/in/web/AuthMeControllerTest.kt
haenaeyo-react/package.json
haenaeyo-react/index.html
haenaeyo-react/tsconfig.json
haenaeyo-react/vite.config.ts
haenaeyo-react/eslint.config.js
haenaeyo-react/src/main.tsx
haenaeyo-react/src/App.tsx
haenaeyo-react/src/styles.css
haenaeyo-react/docs/work-plans/oauth-smoke-test.md
실행한 명령:
./gradlew compileKotlin compileTestKotlin
./gradlew test
npm install --loglevel verbose
npm run typecheck
npm run lint
npm run build
결과:
백엔드 compile/test와 프론트 typecheck/lint/build 통과.
남은 위험:
실제 provider OAuth는 client id/secret과 provider redirect URI 등록이 필요해 로컬 secret 없이는 자동 검증할 수 없다.
Playwright가 이 환경에 설치되어 있지 않아 브라우저 자동 스크린샷 검증은 수행하지 못했다.
다음 추천 에이전트:
Security Reviewer
```
