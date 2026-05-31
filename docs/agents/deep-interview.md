# 에이전트 심층 인터뷰

## 1. 실행 환경

- 에이전트를 어떤 환경에서 실행할까: Codex subagents, Claude Code subagents, GitHub Actions, 로컬 스크립트, 별도 orchestrator?
- 에이전트가 실제로 파일을 수정해도 되는가, 아니면 Planner/Reviewer 계열은 문서 산출물만 남겨야 하는가?
- 여러 에이전트가 동시에 수정할 때 브랜치 전략은 어떻게 할까?

## 2. 권한

- Architect와 Security Reviewer가 반대하면 구현을 멈추는 hard gate로 볼까?
- Code Reviewer와 Verify Agent의 의견이 충돌하면 누가 최종 판단할까?
- Doc Updater는 문서 변경을 자동 커밋 범위에 포함해도 될까?

## 3. 범위

- 1차 마일스톤에서는 backend skeleton만 대상으로 할까, frontend/API client/infrastructure까지 같은 워크플로에 포함할까?
- E2E Test는 언제부터 활성화할까: 로그인 전 mock flow, API skeleton 완성 후, 또는 배포 환경 준비 후?
- Security Reviewer는 매 작업마다 돌릴까, 인증/AI/개인정보/인프라 변경 때만 돌릴까?

## 4. 증거

- 각 에이전트가 남겨야 하는 최소 증거는 무엇일까: 테스트 로그, diff 요약, 체크리스트, 리뷰 코멘트?
- 실패한 검증 결과는 어디에 남길까: PR comment, work plan, 별도 `docs/reviews/`, issue?
- 보안 분류 체계는 P0-P3, Critical/High/Medium/Low, 또는 자체 등급 중 무엇을 쓸까?

## 5. 제품 제약

- MVP에서 “실제 배포 가능”의 최소 기준은 무엇인가: AWS 배포 성공, OAuth 실계정 로그인, 비용 제한, observability까지?
- AI 생성 품질 평가는 누가 승인할까: Planner, Verify Agent, 사용자 수동 확인?
- KST 고정, 목표 최대 60일, quota 같은 제품 정책은 테스트에서 hard rule로 강제할까?
