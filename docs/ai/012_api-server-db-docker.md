# API 서버 DB와 Docker 개발 환경

날짜: 2026-06-09

## 이유

BE가 메모리 저장소만 사용하고 있어 로컬 개발에서 PostgreSQL 기반 실행 환경과 TypeORM 연결 기준이 필요했다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `@nestjs/typeorm`, `typeorm`, `pg`를 API 서버에 추가했다.
- `common/database`에 TypeORM 연결 모듈을 추가했다.
- `auth`, `board` repository를 TypeORM entity 기반 저장소로 바꿨다.
- 개발용 seed 데이터는 DB 초기화 시 repository가 생성하게 했다.
- `apps/api-server/Dockerfile`에 development/build/production target을 추가했다.
- `compose.yml`에 PostgreSQL 18과 API 서버 서비스를 추가했다.
- PostgreSQL은 `PGDATA=/var/lib/postgresql/data/pgdata`와 `${NMM_POSTGRES_DATA_DIR:-$HOME/dev-docker-volume/namanmu/postgres}:/var/lib/postgresql/data` 마운트를 사용한다.
- 로컬 API 서버 실행은 Docker Compose를 감싼 루트 npm script인 `npm run dev:api`로 정했다.
- API 서버 workspace의 직접 실행 script는 제거했다.

## 결과

- API 서버는 기본적으로 PostgreSQL에 연결하고, OpenAPI 생성 시에는 DB 연결을 수동 초기화로 건너뛴다.
- 로컬 개발 DB는 workspace 밖의 host directory에 저장된다.
- API 개발 서버는 루트 npm script만 공식 경로로 둬 실행 환경이 임의 env 조합에 의존하지 않게 했다.
- 검증: `npm run typecheck -w @nmm/api-server`, `npm run openapi:generate`, `docker compose config`, `npm run verify` 통과
- Docker 검증: `npm run docker:api:build`, `npm run dev:api -- -d`, `/api/health`, `/api/posts`, DB seed count 확인 통과
- 후속 작업에서는 migration 전략과 entity 변경 정책을 정해야 한다.
