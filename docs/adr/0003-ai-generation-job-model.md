# ADR 0003: SSE와 draft confirmation을 사용하는 Job 기반 AI 생성 모델

## 상태

Accepted

## 맥락

AI 계획 생성은 느릴 수 있고, 중간에 실패할 수 있으며, 유효하지 않은 output을 만들 수 있다. UI는 실시간 Day card, partial result 보존, 실패 후 이어서 생성, 최종 확정 전 사용자 수정 가능한 draft가 필요하다.

## 결정

AI Generation Job을 사용한다.

- Job 생성은 즉시 `jobId`를 반환한다.
- Background worker가 job을 실행한다.
- 계획 생성/재계획 output은 Day 단위로 저장한다.
- 자료 생성은 최종 Markdown을 저장한다.
- 사용자는 생성된 계획 output을 server-side draft로 수정한다.
- 최종 확정은 `Goal + PlanDay + Todo`를 트랜잭션으로 생성한다.

ECS task 이중화 환경에서는 job 실행 전에 Redis lock과 Postgres conditional state transition을 함께 사용한다. Redis Streams는 SSE event를 전달한다.

## 결과

- Job 실행은 SSE connection lifetime과 분리된다.
- Partial result는 reconnect와 실패 이후에도 보존될 수 있다.
- 사용자가 확정한 domain data와 AI가 생성한 draft data가 분리된다.
- 단순 request/response OpenAI 호출보다 구현은 복잡하지만, 제품 UX와 인프라 목표에 맞다.
