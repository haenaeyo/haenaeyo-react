# 해내요 제품/기술 결정

이 문서는 1차 MVP deep interview에서 확정한 제품/기술 결정을 정리한다.

## 제품 범위

- 목표: 실제 배포 가능한 서비스.
- 핵심 가치: 목표와 기간을 입력하면 AI가 일차별 Todo를 만들고, 수행 결과를 바탕으로 남은 계획을 재조정한다.
- 1차 MVP는 반응형 웹으로 제공한다.
- 네이티브 앱과 알림은 1차 MVP에서 제외한다.
- 로그인 후 진입점은 `오늘` 화면이다.

## 기술 스택

- Frontend: Vite, React, TypeScript.
- Frontend routing: React Router `BrowserRouter`.
- Frontend server state: TanStack Query.
- Frontend global UI state: Zustand는 토스트, 인증 사용자, 생성 중 이동 차단 같은 UI 상태에만 제한적으로 사용한다.
- Styling: Tailwind CSS.
- Component approach: 기본 컴포넌트는 직접 구현하고, Dialog/Tabs/Toast/Menu/Popover 같은 interaction primitive는 Radix UI를 사용한다.
- Icons: `lucide-react`.
- Backend: Spring Boot, Kotlin, Gradle.
- Database: PostgreSQL.
- Cache/runtime coordination: Redis.
- AI provider: OpenAI API.
- DB migration: Flyway.
- API docs: Springdoc OpenAPI / Swagger UI.
- API client: OpenAPI 기반 TypeScript client generated code.

## 아키텍처

- 1차 MVP는 Modular Monolith로 구현한다.
- 이후 MSA 전환을 염두에 두고 bounded context를 나눈다.
- 가장 먼저 분리할 후보 서비스는 AI generation이다.
- 백엔드는 feature/package 중심 헥사고날 아키텍처를 따른다.
- Domain model과 JPA Entity는 분리한다.
- Adapter는 외부 기술 구현을 담당한다.
- Application service는 use case 흐름과 transaction boundary를 담당한다.
- Domain은 Spring, JPA, HTTP, OpenAI에 의존하지 않는다.
- 단일 Spring Boot 모듈 안에서 패키지 규칙을 지키고, ArchUnit으로 의존성 규칙을 검증한다.

## 경계 컨텍스트

- `identity`: OAuth 사용자, 세션, 회원 탈퇴.
- `planning`: 목표, 일차별 계획, Todo, 피드백, 목표 상태, 재계획 적용.
- `ai-generation`: AI 생성 Job, OpenAI 호출, streaming, partial result, draft result, usage.
- `notification`: 추후 알림 기능 후보. 1차 MVP 제외.

## 인증

- Google / GitHub OAuth 로그인을 직접 구현한다.
- 인증은 포트폴리오 핵심 어필 영역으로 두지 않는다.
- Spring Security OAuth2 Login을 사용한다.
- 서버 세션 + HttpOnly Secure Cookie 방식으로 간다.
- 세션 저장소는 Redis Spring Session을 사용한다.
- JWT access/refresh token 직접 구현은 MVP에서 제외한다.
- 로그아웃 시 세션을 삭제한다.
- 회원 탈퇴 시 모든 세션을 무효화한다.

## Redis

- Redis는 필수 인프라로 사용한다.
- MVP Redis 역할:
  - Spring Session 저장소.
  - AI Job distributed lock.
  - AI Job event stream.
- AI Job 이벤트는 Redis Pub/Sub이 아니라 Redis Streams를 사용한다.
- Redis Stream key 예시: `ai-job-events:{jobId}`.
- SSE event id는 Redis Stream entry id를 사용한다.
- Redis는 영구 저장소가 아니다. Job 영구 상태와 partial/draft/result는 Postgres에 저장한다.
- Redis 장애 시 서비스는 fail-fast한다.

## AI 생성

- AI 생성은 Job 기반으로 구현한다.
- Job 생성 API는 즉시 `jobId`를 반환한다.
- Job은 백그라운드 worker가 실행한다.
- ECS task 2개 이상 환경을 전제로 Redis lock + Postgres 상태 조건으로 중복 실행을 방지한다.
- OpenAI API key는 서버에서만 사용한다.
- React는 Spring Boot SSE endpoint를 통해 생성 이벤트를 받는다.
- OpenAI 호출은 `AiGenerationPort` 뒤에 숨긴다.
- `local` / `test` profile은 Mock AI adapter를 사용한다.
- `prod` profile은 OpenAI adapter를 사용한다.
- Mock adapter도 실제 UX 검증을 위해 Day 단위 이벤트를 흘린다.

## AI Job 정책

- 사용자당 active AI Job은 1개만 허용한다.
- Active 상태: `PENDING`, `RETRYING`, `RUNNING`.
- 새 Job 생성 시 active Job이 있으면 `409 Conflict`와 기존 `jobId`를 반환한다.
- Job 상태 후보:
  - `PENDING`
  - `RETRYING`
  - `RUNNING`
  - `COMPLETED`
  - `FAILED`
  - `CANCELED`
- Job retry는 같은 `jobId`를 `RETRYING`으로 재시작한다.
- Job당 retry 최대 횟수는 3회다.
- retry도 usage에 포함한다.
- Redis lock 획득 후에도 Postgres 조건부 상태 업데이트에 성공한 worker만 실행한다.
- Job partial result는 Postgres에 저장하고 Redis Stream으로 이벤트를 발행한다.
- SSE 재연결 시 Postgres partial result를 먼저 replay하고, 이후 Redis Streams 이벤트를 이어서 전달한다.

## AI 출력 형식

- 최초 계획 생성과 재계획은 구조화 JSON으로 받는다.
- AI 자료 생성과 자료 재요청은 Markdown으로 받는다.
- 계획 생성과 재계획은 Day 단위 partial result로 저장한다.
- 자료 생성은 UI에서는 stream을 보여줄 수 있지만 저장은 최종 Markdown 단위로 한다.
- AI output은 외부 입력으로 취급하며 도메인 검증을 통과해야 후보 계획이 된다.
- 검증 실패 시 정상 Day partial은 유지하고 실패 Day는 저장하지 않는다.
- 검증 실패 Job은 `FAILED`로 기록하고, 사용자는 이어서 생성할 수 있다.

## AI 검증

- Day 번호는 `1..totalDays` 범위여야 한다.
- Day 번호는 중복될 수 없다.
- 각 Day에는 Todo가 최소 1개 있어야 한다.
- Todo 제목은 비어 있을 수 없다.
- Todo 예상 시간은 합리적인 범위 안에 있어야 한다.
- Day 총 예상 시간이 사용자의 평일/주말 투자 가능 시간을 크게 넘지 않아야 한다.
- 최초 생성은 전체 Day가 존재해야 한다.
- 재계획은 재계획 대상 Day만 존재해야 한다.

## AI 사용량 제한

- 사용자별 일일 quota를 둔다.
- 계획 생성: 5회/일.
- 재계획: 5회/일.
- 자료 생성/재요청: 20회/일.
- 목표별 계획 다시 생성은 초안 단계에서 3회로 제한한다.
- 목표별 재계획은 하루 3회 정도로 제한한다.
- 제한 초과 시 `429 Too Many Requests`를 반환한다.
- usage에는 모델명, input/output token, estimated cost를 기록한다.

## AI 모델 정책

- 작업별 모델을 분리한다.
- 계획 생성/재계획은 구조화와 일정 품질이 중요하므로 더 좋은 모델을 사용한다.
- 자료 생성/자료 재요청은 상대적으로 저비용 모델을 사용한다.
- 모델명은 환경변수로 관리한다.
  - `OPENAI_PLAN_MODEL`
  - `OPENAI_MATERIAL_MODEL`
- 코드에서는 OpenAI 모델명을 도메인에 직접 노출하지 않는다.

## 목표 생성

- 목표는 계획 확정 시점에 생성한다.
- AI 생성 전 입력값과 생성 초안은 `ai-generation` context가 관리한다.
- 목표 도메인에 `DRAFT` 상태는 두지 않는다.
- 사용자가 생성 결과에서 Todo를 수정하면 서버의 Job draft에 저장한다.
- 확정 시 `draft_result` 기준으로 `Goal + PlanDay + Todo`를 트랜잭션으로 저장한다.
- 확정된 목표 상태는 `IN_PROGRESS`다.

## 목표 정책

- 목표 기간은 최소 1일, 최대 60일이다.
- 시작일은 KST 기준 오늘 이상만 허용한다.
- 종료일은 시작일 이상이어야 한다.
- Day N은 시작일을 Day 1로 계산한다.
- Timezone은 MVP에서 `Asia/Seoul` 고정이다.
- 목표 색상은 서버에서 자동 부여한다.
- 목표 색상 팔레트는 6개 고정이며, 진행 중 목표에서 사용하지 않는 색상을 우선 배정한다.
- 6개가 모두 사용 중이면 사용자별 생성 순서 기반 라운드로빈을 사용한다.
- 완료/중단 목표 색상은 사용 중 계산에서 제외한다.

## 목표 상태

- 목표 상태:
  - `IN_PROGRESS`
  - `PAUSED`
  - `COMPLETED`
- 상태 전이:
  - `IN_PROGRESS -> PAUSED`
  - `PAUSED -> IN_PROGRESS`
  - `IN_PROGRESS -> COMPLETED`
- `COMPLETED`는 최종 상태이며 되돌릴 수 없다.
- 중단한 목표는 재개 후 완료할 수 있다.
- 목표 완료는 언제든 가능하다.
- 미완료 Todo가 있을 때 완료하면 확인 모달을 표시한다.
- 완료된 목표는 수정, Todo 체크, 재계획이 불가능하다.

## 목표 삭제

- 목표 삭제 기능은 포함한다.
- 목표는 모든 상태에서 삭제 가능하다.
- 목표 계열 데이터는 soft delete를 사용한다.
- 삭제 시 `deleted_at`을 설정한다.
- 삭제된 목표는 오늘/목표 목록/캘린더/상세 접근에서 제외한다.
- 삭제된 목표 상세 URL 접근은 `404 Not Found`로 처리한다.
- soft delete 여부는 API 응답으로 노출하지 않는다.
- 삭제 직후 3초 토스트 undo를 제공한다.
- 휴지통/삭제 이력 UI는 MVP에서 제외한다.

## Todo 정책

- Todo 구성은 제목과 예상 소요시간이다.
- 계획 확정 후 Todo는 제목과 예상 소요시간만 수정 가능하다.
- Todo 추가/삭제는 불가능하다.
- Todo 수정은 인라인 수정 후 저장 버튼 방식으로 한다.
- 완료된 Todo는 수정 불가다.
- 완료된 Todo를 다시 미완료로 되돌릴 수 있다.
- 완료 해제 시 완료 시각과 기존 난이도 피드백을 삭제한다.
- 일상적인 Todo 체크는 토스트 없이 시각 상태만 변경한다.

## 피드백

- 난이도 피드백은 선택이다.
- Todo 완료 직후 피드백 패널을 노출한다.
- 난이도 값: 쉬움, 보통, 어려움.
- 메모는 선택이다.
- 피드백을 저장하지 않아도 Todo 완료 상태는 유지한다.
- 저장된 피드백은 이후 자료 생성과 재계획 컨텍스트에 포함한다.

## Day 완료

- Day 완료는 자동 계산한다.
- Day의 모든 Todo가 완료되면 Day 완료로 본다.
- Todo 하나라도 미완료면 Day는 미완료로 본다.
- Day 완료 버튼은 만들지 않는다.
- 목표 진행률은 완료 Todo 수 / 전체 Todo 수 기준이다.

## 재계획

- 재계획 적용 전 기존 계획 전체를 revision snapshot으로 저장한다.
- revision UI는 MVP에서 노출하지 않는다.
- 재계획은 완료된 과거 Day를 변경하지 않는다.
- 오늘 Day가 일부 완료된 상태라면 완료 Todo는 유지하고, 오늘의 미완료 Todo부터 재계획 대상에 포함한다.
- 재계획은 남은 Day/Todo만 새로 생성한다.
- 재계획 적용 시 기존 전체 계획 snapshot을 보관하고 현재 계획 버전을 증가시킨다.
- 새 종료일은 KST 기준 오늘 이상이어야 한다.
- 새 종료일은 목표 시작일 기준 총 60일 이내여야 한다.
- 재계획을 통해서만 목표 기간과 평일/주말 투자 가능 시간을 변경할 수 있다.

## AI 자료

- AI 생성 자료는 Day 단위 1개 Markdown이다.
- 최초 Day 상세 진입 시 material이 없으면 자료 생성 Job을 시작한다.
- 자료 생성 완료 시 즉시 DB에 저장한다.
- 다음 진입부터는 저장된 material을 표시한다.
- 자료 생성 실패 시 material 없음 상태를 유지하고 다시 시도할 수 있다.
- 자료 생성 중에도 화면 이동을 차단한다.
- 자료 재요청은 기존 material을 유지한 채 새 Markdown preview를 생성한다.
- 사용자가 preview를 적용하면 현재 Day material을 교체한다.
- preview 취소 시 기존 material은 유지한다.
- 자료 적용 후 3초 토스트 undo를 제공한다.
- 자료 직접 수정은 textarea 기반 Markdown 편집기로 한다.
- 자료 직접 수정은 수정 모드 + 저장 버튼 방식이다.
- 자동 저장, 이미지 업로드, WYSIWYG editor는 MVP에서 제외한다.
- Markdown 렌더링은 raw HTML을 허용하지 않는다.
- 링크 scheme은 `http`, `https`, `mailto` 정도만 허용한다.

## Query/API 정책

- 성공 응답은 envelope 없이 순수 data를 반환한다.
- 에러 응답은 공통 포맷을 사용한다.
- 공통 에러 예시:

```json
{
  "code": "AI_JOB_ALREADY_RUNNING",
  "message": "진행 중인 생성 작업이 있어요.",
  "details": {
    "jobId": "..."
  }
}
```

- 주요 HTTP status:
  - `400`: 입력 검증 실패.
  - `401`: 미인증.
  - `403`: 소유권/권한 없음.
  - `404`: 리소스 없음.
  - `409`: 상태 충돌, active job 존재.
  - `429`: AI quota 초과.
  - `500`: 예상 못한 서버 오류.
- API ID 타입은 UUID를 사용한다.
- UUID는 애플리케이션에서 생성한다.
- Query는 전용 projection 기반의 실용적 CQRS로 구현한다.
- Command use case는 도메인 모델과 비즈니스 규칙 중심으로 구현한다.
- Query use case는 화면별 projection DTO 조회 중심으로 구현한다.
- 동적 조회는 QueryDSL을 사용하고, Postgres 특화 집계는 native SQL을 허용한다.

## 주요 Query API

- 오늘 화면은 전용 summary API를 사용한다.
  - `GET /api/today`
  - KST 기준 오늘.
  - 진행 중 목표만 포함.
  - 삭제된 목표 제외.
  - 완료/전체/진행률/오늘 Todo를 반환한다.
- 목표 목록은 화면 전용 query API를 사용한다.
  - `GET /api/goals?status=IN_PROGRESS|COMPLETED|PAUSED|ALL`
  - 카드 정보와 상태별 count를 포함한다.
- 캘린더는 월 요약 API와 선택 날짜 Todo API를 분리한다.
  - `GET /api/calendar/month?year=2026&month=5`
  - `GET /api/calendar/days/{date}/todos`

## Frontend UX 정책

- DatePicker는 native `<input type="date">`를 사용한다.
- 캘린더 월 뷰는 별도 컴포넌트로 직접 구현한다.
- 프론트 검증은 UX용으로 수행하고, 백엔드가 최종 검증을 담당한다.
- 생성 중에는 계획 생성/자료 생성/재계획/자료 재요청 모두 이동을 차단한다.
- 이동 시도 시 생성 취소 확인 모달을 표시한다.
- 토스트는 최대 1개만 표시한다.
- 서버 오류/페이지 로딩 실패에만 trace id를 작게 표시한다.
- 일반 입력 오류에는 trace id를 표시하지 않는다.

## 테스트

- Backend는 도메인/유스케이스 테스트 중심으로 작성한다.
- 핵심 구간은 통합 테스트로 검증한다.
- DB 통합 테스트는 Testcontainers + 실제 Postgres를 사용한다.
- ArchUnit으로 헥사고날 의존성 규칙을 검증한다.
- AI/OpenAI 호출은 테스트와 로컬에서 Mock adapter를 사용한다.
- Frontend는 Vitest + React Testing Library로 핵심 UI/상태를 테스트한다.
- Playwright E2E는 핵심 플로우 일부만 포함한다.
- 핵심 E2E 후보:
  - 목표 생성.
  - AI 계획 mock streaming.
  - 생성 결과 수정.
  - 계획 확정.
  - 오늘 화면 Todo 확인.
  - Todo 완료와 피드백.
  - 재계획 mock 적용.

## 배포

- AWS에 배포한다.
- Region: `ap-northeast-2` Seoul.
- Frontend: S3 + CloudFront.
- Backend: ECS Fargate.
- Container registry: ECR.
- Routing: CloudFront `/api/*` -> ALB -> ECS.
- Database: RDS PostgreSQL.
- Redis: ElastiCache Redis.
- Secrets: AWS Secrets Manager.
- Logs: CloudWatch Logs.
- Domain: Route 53 + ACM.
- IaC: AWS CDK TypeScript.
- CI/CD: GitHub Actions.

## AWS 네트워크

- CloudFront가 단일 외부 진입점이다.
- Frontend route는 CloudFront/S3에서 history fallback으로 `index.html`을 반환한다.
- `/api/*`는 CloudFront에서 ALB origin으로 라우팅한다.
- SSE도 CloudFront `/api/*` 경유로 서비스한다.
- Viewer -> CloudFront는 HTTPS only.
- CloudFront -> ALB도 HTTPS를 사용한다.
- ALB inbound는 CloudFront managed prefix list로 제한한다.
- ALB는 public subnet에 둔다.
- ECS task, RDS, ElastiCache는 private subnet에 둔다.
- ECS task outbound는 NAT Gateway를 사용한다.
- NAT Gateway는 초기에는 1개로 시작할 수 있다.

## AWS 가용성

- 인프라 서버 이중화가 핵심이다.
- ECS Fargate backend desired count는 2 이상이다.
- 백엔드는 ECS rolling update를 사용한다.
- Redis는 ElastiCache replication group + Multi-AZ + automatic failover를 사용한다.
- RDS는 초기 비용을 고려해 Single-AZ로 시작한다.
- RDS Multi-AZ는 추후 전환 가능하게 CDK 옵션화한다.

## CI/CD

- GitHub Actions에서 AWS OIDC로 인증한다.
- 장기 AWS access key는 GitHub Secrets에 저장하지 않는다.
- Backend:
  - test.
  - Docker build.
  - ECR push.
  - ECS service rolling update.
- Frontend:
  - typecheck/test/build.
  - S3 sync.
  - CloudFront invalidation.
- Infra:
  - CDK synth.
  - CDK deploy는 별도 workflow 또는 manual approval을 고려한다.
- Backend container image는 multi-stage Dockerfile로 빌드한다.
- Runtime image는 non-root user로 실행한다.

## 시크릿

- Secrets Manager 관리 대상:
  - DB credentials.
  - Redis auth token.
  - OAuth client secrets.
  - OpenAI API key.
  - session/cookie 관련 secret.
- ECS task definition에서 Secrets Manager 값을 env로 주입한다.
- 레포에는 `.env.example`만 둔다.
- 실제 secret은 커밋하지 않는다.

## 관측성

- CloudWatch Logs와 Spring Boot Actuator health를 사용한다.
- Prometheus/Grafana/Sentry는 2차 고도화 후보로 둔다.
- Request log는 method/path/status/duration/trace id만 기록한다.
- Request/response body는 로깅하지 않는다.
- Authorization, Cookie, OAuth token, OpenAI key는 마스킹한다.
- AI prompt와 material 내용은 일반 로그에 남기지 않는다.
- Health check는 liveness/readiness를 분리한다.
- ALB/ECS health check는 앱 생존 중심의 liveness를 사용한다.
- readiness에는 RDS/Redis 상태를 포함한다.
- AWS 최소 알람:
  - ECS task unhealthy/restart.
  - ALB 5xx.
  - RDS CPU/storage/free connections.
  - ElastiCache CPU/connections/memory.
  - CloudFront 5xx.
  - AWS Budget 비용 알람.

## 데이터 삭제

- 목표 계열은 soft delete를 사용한다.
- 회원 탈퇴는 사용자와 관련 데이터를 hard delete한다.
- 회원 탈퇴 시 삭제 대상:
  - OAuth 계정 정보.
  - 사용자 프로필.
  - 목표/계획/Todo/material/feedback.
  - AI generation job/usage/partial/draft/result.
  - plan revision snapshot.
  - session data.
- 운영 로그에는 개인정보를 남기지 않는다.

## 문서화

- README에는 서비스 소개, 로컬 실행, 배포 구조, 주요 기능, 기술 스택을 정리한다.
- `docs/architecture.md`에는 전체 아키텍처를 정리한다.
- `docs/adr/`에는 주요 기술 결정 기록을 남긴다.

## 마일스톤 1

첫 개발 마일스톤은 목표 생성부터 계획 확정까지 API로 동작하는 것이다.

성공 기준:

- 임시 test user 기준 API 호출 가능.
- 목표 입력값으로 AI generation job 생성.
- Mock AI adapter가 Day 단위 partial result 생성.
- Job 상태/partial/draft가 Postgres에 저장.
- 생성 결과 Todo 제목/시간 수정 draft 저장 가능.
- 계획 확정 시 `Goal + PlanDay + Todo` 트랜잭션 저장.
- 확정된 목표가 조회 API에서 확인됨.
- Testcontainers 통합 테스트 통과.
- ArchUnit 기본 규칙 통과.
