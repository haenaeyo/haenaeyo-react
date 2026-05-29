# ADR 0004: AWS ECS Fargate, CloudFront, RDS, ElastiCache 배포

## 상태

Accepted

## 맥락

서비스는 실제로 배포되어야 하고, AWS 인프라는 핵심 포트폴리오 요구사항이다. 서버 이중화는 중요하지만 초기 비용도 중요하다.

## 결정

`ap-northeast-2`에 AWS 배포한다.

- Frontend: S3 + CloudFront.
- Backend: ECS Fargate desired count 2+.
- API routing: CloudFront `/api/*` -> ALB.
- Database: RDS PostgreSQL, 초기에는 Single-AZ.
- Redis: ElastiCache Redis replication group, Multi-AZ, automatic failover.
- IaC: AWS CDK TypeScript.
- CI/CD: GitHub Actions with AWS OIDC.
- Secrets: AWS Secrets Manager.

viewer -> CloudFront와 CloudFront -> ALB 구간은 HTTPS를 사용한다. ALB inbound는 CloudFront managed prefix list로 제한한다. ECS task, RDS, ElastiCache는 private subnet에 둔다. Private outbound access는 NAT Gateway를 사용한다.

## 결과

- 아키텍처가 실제 배포, routing, secret management, server redundancy를 보여준다.
- RDS는 비용 때문에 초기에는 Multi-AZ가 아니지만, CDK에서 설정 가능하게 유지한다.
- NAT Gateway와 Redis replication group은 운영 비용을 만든다.
- CloudFront `/api/*` proxy는 browser origin/cookie 동작을 단순화한다.
