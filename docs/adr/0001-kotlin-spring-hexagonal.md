# ADR 0001: Kotlin Spring Boot와 feature-based hexagonal architecture

## 상태

Accepted

## 맥락

해내요 백엔드는 풍부한 계획 도메인, AI generation job, OAuth 로그인, SSE, Redis coordination, 추후 MSA 분리를 지원해야 한다. 프로젝트 오너는 Java 운영 경험이 있지만, 표현력 있는 도메인 모델링과 간결한 Spring Boot 코드를 위해 Kotlin을 선택했다.

## 결정

Kotlin Spring Boot를 Modular Monolith로 사용한다. 백엔드 패키지는 feature 기준으로 나누고, 각 feature 안에서 hexagonal architecture를 적용한다.

Domain model과 JPA Entity는 분리한다. Postgres, Redis, OAuth, OpenAI 같은 외부 시스템은 ports/adapters를 통해 접근한다.

## 결과

- Domain 규칙은 Spring/JPA 없이 테스트 가능하게 유지된다.
- AI generation은 나중에 별도 서비스로 분리할 수 있다.
- Kotlin/JPA 설정은 no-arg/all-open과 entity constructor 제약을 신중히 다뤄야 한다.
- ArchUnit test가 의존성 방향을 강제한다.
