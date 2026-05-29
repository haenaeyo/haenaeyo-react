# ADR 0005: Testcontainers, ArchUnit, Swagger, OpenAPI client generation

## 상태

Accepted

## 맥락

프로젝트는 모든 하위 시스템을 과하게 만들지 않으면서도 포트폴리오 수준의 신뢰도를 보여줘야 한다. 아키텍처는 Postgres 특화 동작, hexagonal dependency rule, typed frontend/backend contract에 의존한다.

## 결정

- DB integration test는 Testcontainers와 실제 PostgreSQL을 사용한다.
- Hexagonal dependency rule은 ArchUnit으로 강제한다.
- API 문서는 Springdoc OpenAPI / Swagger UI를 사용한다.
- Frontend TypeScript API client/type은 OpenAPI에서 생성한다.
- 핵심 UI test는 Vitest + React Testing Library를 사용한다.
- 중요한 E2E flow 일부만 Playwright로 검증한다.

## 결과

- Postgres JSONB, index, query behavior를 실제 DB engine에 가깝게 테스트한다.
- Architecture violation은 test에서 실패한다.
- Frontend와 backend API type이 정렬된다.
- Test scope는 모든 UI를 포괄하기보다 위험도가 높은 경로에 집중한다.
