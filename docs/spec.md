# 영화 티켓 예매 시스템 - 기술 스펙 문서

## 1. 과제 요약

| 항목 | 내용 |
|------|------|
| 회사 | (주)유비케어 (GC녹십자그룹 계열사) |
| 포지션 | 백엔드 개발 |
| 과제 | 영화 티켓 예매 시스템 |
| 필수 스택 | Node.js, PostgreSQL |
| 제출물 | 소스코드 + README.md |
| 기한 | 면접 전 자유 제출 |
| 핵심 원칙 | 실제 서비스 수준 완성도, 핵심 기능 위주, 과도한 구현 지양 |

## 2. 기술 스택 선정

| 레이어 | 기술 | 선정 이유 |
|--------|------|-----------|
| Runtime | Node.js | 필수 |
| Framework | NestJS | 구조화된 아키텍처, 채용공고 실무 환경에 부합 |
| Database | PostgreSQL | 필수 |
| ORM | Prisma | 타입 안전성, 직관적 스키마 정의, 자동 마이그레이션 |
| Auth | JWT (Access Token) | RESTful API 인증 표준 |
| Validation | class-validator | DTO 검증 |
| Testing | Jest + supertest | 유닛/E2E 테스트 |
| API Docs | Swagger (nestjs/swagger) | API 문서 자동 생성 |
| Container | Docker + docker-compose | 실행 환경 일관성 보장 |
| Frontend | Next.js (App Router) | 시연용 UI, React 생태계 활용 |

## 3. 도메인 모델 (ERD)

### 3.1 엔티티 정의

#### User (회원)
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 회원 고유 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 (로그인 ID) |
| password | VARCHAR(255) | NOT NULL | bcrypt 해시 비밀번호 |
| name | VARCHAR(100) | NOT NULL | 회원명 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 가입일시 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 수정일시 |

#### Movie (영화)
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 영화 고유 ID |
| title | VARCHAR(255) | NOT NULL | 영화 제목 |
| description | TEXT | | 영화 설명 |
| genre | VARCHAR(50) | NOT NULL | 장르 |
| duration_minutes | INTEGER | NOT NULL | 상영 시간(분) |
| rating | VARCHAR(10) | NOT NULL | 등급 (전체, 12세, 15세, 청불) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 등록일시 |

#### Screen (상영관)
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 상영관 고유 ID |
| name | VARCHAR(50) | NOT NULL | 상영관명 (예: 1관) |
| total_seats | INTEGER | NOT NULL | 총 좌석 수 |

#### Seat (좌석)
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 좌석 고유 ID |
| screen_id | UUID | FK → Screen | 상영관 |
| row | VARCHAR(1) | NOT NULL | 행 (A~J) |
| number | INTEGER | NOT NULL | 좌석 번호 |
| UNIQUE | | (screen_id, row, number) | 복합 유니크 |

#### Screening (상영 시간표)
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 상영 고유 ID |
| movie_id | UUID | FK → Movie | 영화 |
| screen_id | UUID | FK → Screen | 상영관 |
| start_time | TIMESTAMP | NOT NULL | 상영 시작 시간 |
| end_time | TIMESTAMP | NOT NULL | 상영 종료 시간 |
| price | DECIMAL(10,2) | NOT NULL | 티켓 가격 |

#### Reservation (예매)
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 예매 고유 ID |
| user_id | UUID | FK → User | 예매 회원 |
| screening_id | UUID | FK → Screening | 상영 회차 |
| seat_id | UUID | FK → Seat | 좌석 |
| status | ENUM | NOT NULL, DEFAULT 'CONFIRMED' | CONFIRMED / CANCELLED |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 예매일시 |
| cancelled_at | TIMESTAMP | | 취소일시 |

> **동시성 제어 전략**: `(screening_id, seat_id) WHERE status='CONFIRMED'` 조건의 Partial Unique Index를 DB에 설정.
> 서비스 레이어의 `$transaction` 내 Check-Then-Act는 빠른 피드백용이며, 동시 요청 시 DB 제약조건이 최종 안전장치로 동작.
> CANCELLED 상태는 인덱스에서 제외되므로, 취소 후 동일 좌석 재예매가 정상적으로 허용됨.

### 3.2 관계도

```
User 1 ── N Reservation
Movie 1 ── N Screening
Screen 1 ── N Screening
Screen 1 ── N Seat
Screening 1 ── N Reservation
Seat 1 ── N Reservation
```

## 4. API 설계

### 4.1 인증 API

| Method | Endpoint | 설명 | Auth |
|--------|----------|------|------|
| POST | /api/auth/signup | 회원가입 | X |
| POST | /api/auth/login | 로그인 (JWT 발급) | X |

### 4.2 영화 API

| Method | Endpoint | 설명 | Auth |
|--------|----------|------|------|
| GET | /api/movies | 영화 목록 조회 | X |
| GET | /api/movies/:id | 영화 상세 조회 | X |

### 4.3 상영 API

| Method | Endpoint | 설명 | Auth |
|--------|----------|------|------|
| GET | /api/movies/:movieId/screenings | 특정 영화 상영 시간표 조회 | X |
| GET | /api/screenings/:id/seats | 특정 상영의 좌석 현황 조회 (예매 가능 여부 포함) | X |

### 4.4 예매 API

| Method | Endpoint | 설명 | Auth |
|--------|----------|------|------|
| POST | /api/reservations | 좌석 예매 | O |
| GET | /api/reservations | 내 예매 내역 조회 | O |
| PATCH | /api/reservations/:id/cancel | 예매 취소 | O |

## 5. 핵심 설계 포인트

### 5.1 좌석 예매 동시성 제어
- **2단계 방어 전략**으로 동시성 문제 해결
  1. **서비스 레이어 (빠른 피드백)**: `$transaction` 내에서 status='CONFIRMED'인 예매 존재 여부 체크 → 대부분의 중복 요청을 즉시 차단
  2. **DB 레벨 (최종 안전장치)**: `(screening_id, seat_id) WHERE status='CONFIRMED'` Partial Unique Index → 동시 요청이 Check를 동시에 통과해도 INSERT 시점에 DB가 중복을 거부
- Prisma P2002 에러(Unique Constraint Violation)를 catch하여 409 ConflictException으로 변환
- CANCELLED 상태는 Partial Index에서 제외되므로 취소 후 동일 좌석 재예매 정상 허용

### 5.2 인증/인가
- JWT 기반 Access Token만 사용 (Refresh Token 미사용 — 과제 범위에 충분)
- bcrypt로 비밀번호 해시 저장
- Guard를 통한 인증 필수 엔드포인트 보호
- 로그인 API는 `@HttpCode(200)` 적용 (POST이지만 리소스 생성이 아닌 인증 행위이므로)
- Signup/Login DTO 모두 `@MinLength(6)` 적용으로 검증 일관성 확보

### 5.3 데이터 무결성
- 외래키 제약조건으로 참조 무결성 보장
- 예매 시 상영 시간 유효성 검증 (과거 상영 예매 방지)
- status ENUM으로 예매 상태 관리

### 5.4 에러 처리
- GlobalExceptionFilter로 모든 예외를 일관된 JSON 포맷 (`statusCode`, `message`, `timestamp`, `path`)으로 반환
- 예상치 못한 에러는 로그 기록 후 클라이언트에는 제네릭 메시지만 노출

### 5.5 시드 데이터
- 영화 7편, 상영관 3개, 상영 시간표 42개, 좌석 데이터를 seed 스크립트로 제공
- 영화 7편 전체에 상영 시간표가 배정되어 빈 화면 없이 전체 플로우 시연 가능
- `npx prisma db seed`로 초기 데이터 투입 가능

### 5.6 테스트 전략
- **유닛 테스트**: 각 Service의 핵심 비즈니스 로직 (각 Phase에서 함께 작성)
- **E2E 테스트**: 핵심 플로우 1개 (회원가입 → 로그인 → 예매 → 조회 → 취소)
- PrismaService 모킹으로 유닛 테스트 격리

## 6. 프로젝트 구조

```
src/
├── main.ts
├── app.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── decorators/
│   ├── guards/
│   └── filters/
│       └── global-exception.filter.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.service.spec.ts
│   ├── jwt.strategy.ts
│   └── dto/
├── movie/
│   ├── movie.module.ts
│   ├── movie.controller.ts
│   ├── movie.service.ts
│   ├── movie.service.spec.ts
│   └── dto/
├── screening/
│   ├── screening.module.ts
│   ├── screening.controller.ts
│   ├── screening.service.ts
│   ├── screening.service.spec.ts
│   └── dto/
├── reservation/
│   ├── reservation.module.ts
│   ├── reservation.controller.ts
│   ├── reservation.service.ts
│   ├── reservation.service.spec.ts
│   └── dto/
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
frontend/                    # Next.js 프론트엔드
├── app/
│   ├── layout.tsx
│   ├── page.tsx             # 영화 목록
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── movies/[id]/page.tsx # 영화 상세 + 상영 시간표
│   ├── screenings/[id]/page.tsx # 좌석 선택 + 예매
│   └── my-reservations/page.tsx
├── lib/                     # API 클라이언트, 인증
└── components/
test/
├── app.e2e-spec.ts
└── jest-e2e.json
```

## 7. 실행 환경

```bash
# docker-compose로 PostgreSQL + App 실행
docker-compose up -d

# 또는 로컬 실행
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# 테스트
npm run test          # 유닛 테스트
npm run test:e2e      # E2E 테스트
```

## 8. 채용공고 우대사항 반영 전략

| 우대사항 | 반영 방식 |
|----------|-----------|
| Redis 사용 경험 | 미사용 (README에 확장 시 활용 방안 언급) |
| 트랜잭션/데이터 무결성 | 예매 프로세스에서 핵심적으로 구현 |
| RESTful API 설계 | 리소스 중심 URL 설계, HTTP 메서드 적절 사용 |
| PostgreSQL | 전체 데이터 저장소 |
| DB 스키마 설계 | Prisma schema로 정규화된 ERD, 적절한 인덱싱 |
| 성능 튜닝 | 쿼리 최적화, 인덱스 설계 |
