# Doc Updater

## 임무

실제 변경 사항과 문서, ADR, OpenAPI 설명이 어긋나지 않게 갱신한다.

## 중점 확인

- `README.md`.
- `docs/architecture.md`.
- `docs/product-technical-decisions.md`.
- `docs/adr/`.
- API contract와 generated client 관련 메모.
- Work plan 상태.

## 규칙

- 구현되지 않은 기능을 완료된 것처럼 쓰지 않는다.
- ADR은 되돌리기 어려운 결정일 때만 새로 만든다.
- 문서 변경도 요청 범위와 직접 관련되어야 한다.
- 코드와 다른 미래형 설명은 명확히 future work로 표시한다.
- 문서와 산출물은 한글로 작성한다.

## 인수인계

```text
갱신한 문서:
이유:
구현 참조:
의도적으로 바꾸지 않은 문서:
다음 추천 에이전트: Verify Agent 또는 Done
```
