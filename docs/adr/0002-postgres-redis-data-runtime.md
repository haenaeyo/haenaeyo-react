# ADR 0002: PostgreSQL은 source of truth, Redis는 session과 runtime coordination 담당

## 상태

Accepted

## 맥락

MVP는 사용자 계정, 목표, 계획, Todo 피드백, AI 생성 자료, 계획 revision, AI job 추적을 포함하는 실제 배포 서비스다. 서버 측 인프라 이중화는 핵심 포트폴리오 주제다. Redis는 ECS task 간 session 공유와 AI job coordination을 위해 필요하다.

## 결정

PostgreSQL을 durable source of truth로 사용한다. Redis는 다음 용도로 사용한다.

- Spring Session.
- AI Job distributed lock.
- AI Job Redis Streams event.

AI Job의 영구 상태, partial result, draft result, 실패 사유, token usage, final result는 PostgreSQL에 저장한다.

## 결과

- ECS task를 1개 이상으로 확장해도 session을 공유할 수 있다.
- SSE client는 어떤 backend task에 연결되어도 AI job event를 받을 수 있다.
- Redis 장애 시 서비스는 fail-fast한다.
- Redis Streams는 durable business storage로 취급하지 않고, Postgres가 authoritative storage로 남는다.
