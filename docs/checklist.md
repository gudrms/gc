# 영화 티켓 예매 시스템 - 구현 체크리스트

> **확정 스택**: NestJS + Prisma + JWT(Access만) + Jest + Swagger + Docker(단순) + Next.js(프론트)
> **제외**: Redis, Refresh Token, 멀티스테이지 빌드

## Phase 1: 프로젝트 초기 설정 + 글로벌 설정

- [x] NestJS 프로젝트 생성 (`nest new`)
- [x] Prisma 설치 및 초기화 (`npx prisma init`)
- [x] docker-compose.yml 작성 (PostgreSQL 컨테이너)
- [x] 환경 변수 설정 (.env, ConfigModule)
- [x] PrismaModule / PrismaService 생성
- [x] 글로벌 ValidationPipe 설정 (main.ts)
- [x] 글로벌 GlobalExceptionFilter 설정 (일관된 에러 응답 포맷)
- [x] 글로벌 API prefix `/api` 설정
- [x] Swagger 기본 설정 (main.ts)
- [x] CORS 설정 (localhost + IP 주소 허용)

## Phase 2: Prisma 스키마 및 마이그레이션

- [x] schema.prisma 작성 (User, Movie, Screen, Seat, Screening, Reservation)
- [x] 엔티티 간 관계 설정 (1:N)
- [x] @@unique([screenId, row, number]) 좌석 복합 유니크
- [x] @@index 설정 (screening의 movieId, reservation의 screeningId 등)
- [x] Reservation에 Partial Unique Index 적용 (screening_id, seat_id WHERE status='CONFIRMED')
- [x] `npx prisma migrate dev` 실행 확인

## Phase 3: 인증 기능 (회원가입/로그인)

- [x] AuthModule, AuthController, AuthService 생성
- [x] **회원가입 API** (POST /api/auth/signup)
  - [x] SignupDto (email, password, name) + @ApiProperty
  - [x] 이메일 중복 체크
  - [x] bcrypt 비밀번호 해시
- [x] **로그인 API** (POST /api/auth/login)
  - [x] LoginDto (email, password) + @ApiProperty
  - [x] @HttpCode(200) 적용
  - [x] 비밀번호 검증 → JWT Access Token 발급
- [x] JwtStrategy + JwtAuthGuard 구현
- [x] @CurrentUser 데코레이터
- [x] **auth.service.spec.ts** 유닛 테스트

## Phase 4: 영화/상영 정보 조회 API

- [x] MovieModule + MovieController + MovieService
- [x] ScreeningModule + ScreeningController + ScreeningService
- [x] **영화 목록 조회** (GET /api/movies) + Swagger
- [x] **영화 상세 조회** (GET /api/movies/:id) + Swagger
- [x] **상영 시간표 조회** (GET /api/movies/:movieId/screenings) + Swagger
- [x] **좌석 현황 조회** (GET /api/screenings/:id/seats) + Swagger — 예매 여부 포함
- [x] **movie.service.spec.ts** 유닛 테스트
- [x] **screening.service.spec.ts** 유닛 테스트

## Phase 5: 좌석 예매 기능

- [x] ReservationModule + ReservationController + ReservationService
- [x] **좌석 예매** (POST /api/reservations) + Swagger
  - [x] CreateReservationDto (screeningId, seatId)
  - [x] 인증 필수 (JwtAuthGuard)
  - [x] 상영 시간 유효성 검증 (과거 상영 불가)
  - [x] Prisma $transaction 내 status='CONFIRMED' 체크
  - [x] DB Partial Unique Index로 동시성 제어
  - [x] Prisma P2002 에러 → ConflictException 변환
  - [x] 이미 예매된 좌석 → 409 Conflict
- [x] **예매 내역 조회** (GET /api/reservations) + Swagger
  - [x] 본인 예매만, 영화/상영/좌석 정보 포함
- [x] **예매 취소** (PATCH /api/reservations/:id/cancel) + Swagger
  - [x] 본인 예매만 취소 가능
  - [x] status → CANCELLED, cancelledAt 기록
  - [x] 이미 취소된 예매 재취소 방지
- [x] **reservation.service.spec.ts** 유닛 테스트 (예매/취소/내역조회)

## Phase 6: 시드 데이터

- [x] prisma/seed.ts 작성
- [x] 영화 7편
- [x] 상영관 3개
- [x] 좌석 자동 생성 (상영관별)
- [x] 상영 시간표 42개 (내일부터 3일간)
- [x] package.json에 prisma.seed 설정
- [x] 데이터 존재 시 중복 실행 방지 (재시작해도 데이터 보존)

## Phase 7: Next.js 프론트엔드

- [x] Next.js 프로젝트 생성 (frontend/)
- [x] 공통 레이아웃 + 네비게이션 (Navbar)
- [x] **회원가입 페이지** (/signup)
- [x] **로그인 페이지** (/login)
- [x] **영화 목록 페이지** (/) — 카드 형태
- [x] **영화 상세 + 상영 시간표 페이지** (/movies/[id])
- [x] **좌석 선택 + 예매 페이지** (/screenings/[id]) — 좌석 그리드
- [x] **내 예매 내역 페이지** (/my-reservations) — 취소 버튼 포함
- [x] API 연동 (fetch, JWT 토큰 관리)
- [x] 인증 상태 관리 (Context)

## Phase 8: Docker 설정

- [x] backend Dockerfile
- [x] frontend Dockerfile
- [x] docker-compose.yml (postgres + backend + frontend)
- [x] docker-compose 환경변수 보안 처리 (JWT_SECRET 외부 주입 가능)
- [x] .env.example 제공
- [x] Alpine + OpenSSL 설치 (Prisma 엔진 호환)
- [x] docker-compose up 원클릭 실행 최종 확인

## Phase 9: E2E 테스트

- [x] test/app.e2e-spec.ts
- [x] 회원가입 → 로그인 → 토큰 획득 플로우
- [x] 영화 목록/상세 조회
- [x] 좌석 예매 → 내역 조회 → 취소 플로우
- [x] 중복 예매 에러 케이스 (409)
- [x] 미인증 접근 에러 케이스 (401)
- [x] 타인 예매 취소 시도 (403)

## Phase 10: README.md

- [x] 프로젝트 소개
- [x] 실행 방법 (docker-compose / 로컬)
- [x] 프로젝트 구조 설명
- [x] 설계 의도 (NestJS, Prisma, Next.js 선택 이유)
- [x] 고려한 사항 (동시성 제어, 트랜잭션, 확장 가능성)
- [x] API 엔드포인트 요약
- [x] ERD (Mermaid 다이어그램)

## Phase 11: 최종 검증

- [x] npm run test 전체 통과 (20개)
- [ ] npm run test:e2e 전체 통과 ← **미확인**
- [x] docker-compose up 클린 실행 최종 확인
- [x] 시드 데이터 정상 투입 (재시작 시 보존)
- [x] Swagger UI 정상 동작
- [ ] 프론트엔드에서 전체 플로우 동작 확인 ← **CORS 수정 후 미확인**
- [x] README대로 따라했을 때 실행 가능
- [x] .gitignore 확인
- [ ] .dockerignore 확인 ← **dist 제외 확인했으나 최종 빌드 검증 필요**
- [x] 불필요한 파일 정리

---

## 남은 작업 (우선순위 순)

| 우선순위 | 작업 | 비고 |
|---------|------|------|
| ~~🔴 높음~~ | ~~`docker-compose up` 원클릭 실행 최종 확인~~ | ✅ 완료 |
| 🔴 높음 | 프론트엔드 전체 플로우 동작 확인 | CORS 수정 후 브라우저 테스트 필요 |
| 🟡 중간 | `npm run test:e2e` 통과 확인 | DB 연결 필요 |
| 🟡 중간 | .dockerignore 최종 빌드 검증 | |

---

## 평가 포인트 예측

| 포인트 | 어필 항목 |
|--------|-----------|
| Node.js API 개발 | NestJS 모듈 구조, 전체 API 구현 |
| RESTful API 설계 | 리소스 URL, HTTP 메서드/상태코드 |
| PostgreSQL | Prisma 스키마, 트랜잭션, 제약조건 |
| 트랜잭션/무결성 | 예매 동시성 제어 (Partial Unique Index + interactive transaction) |
| 코드 품질 | 테스트 코드 (유닛 20개 + E2E 17개), 일관된 구조 |
| 실행 가능성 | Docker 원클릭 실행 |
| 완성도 | Next.js 프론트엔드로 실제 서비스 시연 가능 |
