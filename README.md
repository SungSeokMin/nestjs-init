# nestjs-init

NestJS 프로젝트를 시작할 때마다 반복되는 초기 셋팅(Database, Logging, Config, Auth 등)을 미리 구성해 둔 보일러플레이트입니다.

## 포함된 설정

| 항목 | 내용 |
|------|------|
| **Database** | TypeORM + PostgreSQL 16, Migration 지원 |
| **Logging** | Winston + nest-winston, 개발/운영 포맷 분리 |
| **Config** | `@nestjs/config` + 환경별 `.env` 파일 분기 |
| **Auth** | JWT Bearer Token 미들웨어, Guard |
| **Swagger** | `@nestjs/swagger` + 자동 문서화 |
| **Validation** | `class-validator` + `class-transformer` 글로벌 파이프 |
| **Error Handling** | 글로벌 HttpExceptionFilter, BusinessException |
| **Transaction** | TransactionInterceptor (자동 커밋/롤백) |
| **Docker** | Multi-stage Dockerfile + docker-compose (PostgreSQL) |
| **CI/CD** | GitHub Actions (CI: Build/Test, CD: Docker Hub + EC2 배포) |

---

## 프로젝트 구조

```
src/
├── main.ts                          # 앱 진입점 (Winston, Swagger, ValidationPipe 설정)
├── app.module.ts                    # 루트 모듈 (ConfigModule, TypeORM, BearerTokenMiddleware)
├── app.controller.ts                # 헬스체크 엔드포인트 (GET /health)
├── config/
│   └── database.config.ts           # TypeORM 설정 팩토리
├── common/
│   ├── common.module.ts             # 글로벌 모듈 (JWT, Winston, Guard 제공)
│   ├── decorators/
│   │   ├── bearer.decorator.ts          # @BearerRequired(), @BearerOptional()
│   │   ├── user-id.decorator.ts         # @UserId() 파라미터 데코레이터
│   │   ├── query-runner.decorator.ts    # @QueryRunnerDecorator() 파라미터 데코레이터
│   │   ├── skip-logging.decorator.ts    # @SkipLogging() 메서드 데코레이터
│   │   └── api-error-response.decorator.ts  # @ApiErrorResponse() Swagger 데코레이터
│   ├── dto/
│   │   ├── page-request.dto.ts      # 페이지네이션 요청 DTO (page, pageSize)
│   │   └── page-result.dto.ts       # 페이지네이션 응답 DTO (items, hasNext)
│   ├── entities/
│   │   └── base.entity.ts           # createdAt, updatedAt 자동 관리
│   ├── exceptions/
│   │   ├── error-code.enum.ts       # 에러 코드 정의 (code, message, status)
│   │   └── business.exception.ts    # 비즈니스 예외 클래스
│   ├── filters/
│   │   └── http-exception.filter.ts # 글로벌 예외 필터 → { code, message } 응답
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # JWT 인증 필수 가드
│   │   └── jwt-auth-optional.guard.ts  # JWT 인증 선택 가드
│   ├── interceptors/
│   │   ├── logging.interceptor.ts   # HTTP 요청/응답 로깅
│   │   └── transaction.interceptor.ts  # DB 트랜잭션 자동 관리
│   ├── logger/
│   │   └── winston.config.ts        # Winston 로거 설정 (개발: 컬러, 운영: JSON)
│   ├── middleware/
│   │   └── bearer-token.middleware.ts  # JWT 추출 → req.user 주입
│   └── services/
│       └── jwt-util.service.ts      # Access/Refresh 토큰 발급 및 검증
└── database/
    ├── data-source.ts               # TypeORM DataSource (migration CLI용)
    └── migrations/                  # 마이그레이션 파일 위치
```

---

## 빠른 시작

### 1. Fork 및 Clone

```bash
git clone https://github.com/YOUR_USERNAME/nestjs-init.git my-project
cd my-project
```

### 2. 패키지 설치

```bash
pnpm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
# .env.local 파일을 열어 값 수정
```

### 4. 데이터베이스 실행 (Docker)

```bash
docker-compose up -d
# PostgreSQL이 localhost:5432로 실행됩니다
```

### 5. 마이그레이션 실행

```bash
pnpm migration:run:dev
```

### 6. 개발 서버 실행

```bash
pnpm start:dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Health Check: http://localhost:3000/health

---

## 환경 변수

`.env.example`을 참고하여 환경별 파일을 생성합니다.

| 파일 | 사용 환경 |
|------|----------|
| `.env.local` | 로컬 개발 (git-ignored) |
| `.env.development` | 개발 서버 |
| `.env.production` | 운영 서버 |

| 변수 | 설명 | 예시 |
|------|------|------|
| `NODE_ENV` | 실행 환경 | `development` |
| `PORT` | 서버 포트 | `3000` |
| `DB_HOST` | DB 호스트 | `localhost` |
| `DB_PORT` | DB 포트 | `5432` |
| `DB_USERNAME` | DB 사용자명 | `nestjs` |
| `DB_PASSWORD` | DB 비밀번호 | `nestjs!@` |
| `DB_DATABASE` | DB 이름 | `nestjs_db` |
| `JWT_SECRET` | JWT 서명 키 | `your-secret-key` |

---

## 주요 기능 사용법

### JWT 인증

```typescript
// 인증 필수 엔드포인트
@UseGuards(JwtAuthGuard)
@BearerRequired()
@Get('me')
getMe(@UserId() userId: number) {
  return this.userService.findOne(userId);
}

// 인증 선택 엔드포인트
@UseGuards(JwtAuthOptionalGuard)
@BearerOptional()
@Get('posts')
getPosts(@UserId() userId: number | null) { ... }
```

### 트랜잭션 처리

```typescript
@UseInterceptors(TransactionInterceptor)
@Post()
async create(
  @Body() dto: CreateDto,
  @QueryRunnerDecorator() qr: QueryRunner,
) {
  return this.service.create(dto, qr);
}
```

### 비즈니스 예외

```typescript
// 에러 코드 추가 (error-code.enum.ts)
MY_RESOURCE_NOT_FOUND: {
  code: 'MY_RESOURCE_NOT_FOUND',
  message: '리소스를 찾을 수 없습니다.',
  status: HttpStatus.NOT_FOUND,
}

// 예외 발생
throw new BusinessException(ErrorCode.MY_RESOURCE_NOT_FOUND);
// → 응답: { code: 'MY_RESOURCE_NOT_FOUND', message: '리소스를 찾을 수 없습니다.' }
```

### 페이지네이션

```typescript
@Get()
async findAll(@Query() query: PageRequestDto) {
  const items = await this.repo.find({
    skip: query.skip,
    take: query.pageSize + 1,  // +1로 hasNext 판별
  });
  return PageResultDto.of(items, query.page, query.pageSize);
}
```

### 베이스 엔티티

```typescript
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
  // createdAt, updatedAt 자동 포함
}
```

---

## 마이그레이션

```bash
# 마이그레이션 파일 생성
pnpm migration:create

# 마이그레이션 자동 생성 (엔티티 변경 감지)
pnpm migration:generate

# 마이그레이션 실행
pnpm migration:run:dev

# 마이그레이션 롤백
pnpm migration:revert:dev
```

---

## Docker 배포

```bash
# 이미지 빌드
docker build -t nestjs-init .

# 컨테이너 실행 (마이그레이션 자동 실행 후 앱 시작)
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  nestjs-init
```

---

## CI/CD (GitHub Actions)

### CI (`ci.yml`)
- **트리거**: `main`, `dev` 브랜치로의 PR
- **동작**: 의존성 설치 → 빌드 → 테스트

### CD (`cd.yml`)
- **트리거**: `main`, `dev` 브랜치 push
- **동작**: Docker 이미지 빌드 → Docker Hub push → EC2 배포 (AWS SSM)

### 필요한 GitHub Secrets

| Secret | 설명 |
|--------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 사용자명 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token |
| `AWS_ROLE_ARN` | AWS OIDC Role ARN |
| `AWS_REGION` | AWS 리전 (예: `ap-northeast-2`) |
| `EC2_INSTANCE_ID` | EC2 인스턴스 ID |
| `DB_HOST` | 운영 DB 호스트 |
| `DB_PORT` | 운영 DB 포트 |
| `DB_USERNAME` | 운영 DB 사용자명 |
| `DB_PASSWORD` | 운영 DB 비밀번호 |
| `DB_DATABASE` | 운영 DB 이름 |
| `JWT_SECRET` | 운영 JWT 서명 키 |

---

## 새 모듈 추가하기

```bash
# NestJS CLI로 모듈 생성
nest g module modules/post
nest g controller modules/post
nest g service modules/post
```

생성 후 `app.module.ts`의 `imports`에 추가합니다.

---

## 기술 스택

- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **ORM**: TypeORM 0.3
- **Database**: PostgreSQL 16
- **Logging**: Winston + nest-winston
- **Auth**: JWT (@nestjs/jwt)
- **Docs**: Swagger (@nestjs/swagger)
- **Package Manager**: pnpm
- **Container**: Docker + docker-compose
- **CI/CD**: GitHub Actions
