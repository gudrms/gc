import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('Movie Booking API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let movieId: string;
  let screeningId: string;
  let seatId: string;
  let reservationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.reservation.deleteMany({
      where: { user: { email: { in: ['e2e-test@example.com', 'other-e2e@example.com'] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['e2e-test@example.com', 'other-e2e@example.com'] } },
    });
    await app.close();
  });

  describe('Auth Flow', () => {
    it('POST /api/auth/signup - 회원가입 성공', () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'e2e-test@example.com',
          password: 'test1234',
          name: 'E2E 테스터',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe('e2e-test@example.com');
          expect(res.body.name).toBe('E2E 테스터');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('POST /api/auth/signup - 이메일 중복 시 409', () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'e2e-test@example.com',
          password: 'test1234',
          name: 'E2E 테스터',
        })
        .expect(409);
    });

    it('POST /api/auth/login - 로그인 성공', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'e2e-test@example.com',
          password: 'test1234',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user.email).toBe('e2e-test@example.com');
          accessToken = res.body.accessToken;
        });
    });

    it('POST /api/auth/login - 잘못된 비밀번호 시 401', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'e2e-test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Movie & Screening Flow', () => {
    it('GET /api/movies - 영화 목록 조회', () => {
      return request(app.getHttpServer())
        .get('/api/movies')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          movieId = res.body[0].id;
        });
    });

    it('GET /api/movies/:id - 영화 상세 조회', () => {
      return request(app.getHttpServer())
        .get(`/api/movies/${movieId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(movieId);
          expect(res.body.title).toBeDefined();
        });
    });

    it('GET /api/movies/:id - 존재하지 않는 영화 404', () => {
      return request(app.getHttpServer())
        .get('/api/movies/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('GET /api/movies/:movieId/screenings - 상영 시간표 조회', () => {
      return request(app.getHttpServer())
        .get(`/api/movies/${movieId}/screenings`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          screeningId = res.body[0].id;
        });
    });

    it('GET /api/screenings/:id/seats - 좌석 현황 조회', () => {
      return request(app.getHttpServer())
        .get(`/api/screenings/${screeningId}/seats`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('isReserved');
          const available = res.body.find((s: any) => !s.isReserved);
          if (available) seatId = available.id;
        });
    });
  });

  describe('Reservation Flow', () => {
    it('POST /api/reservations - 미인증 시 401', () => {
      return request(app.getHttpServer())
        .post('/api/reservations')
        .send({ screeningId, seatId })
        .expect(401);
    });

    it('POST /api/reservations - 예매 성공', () => {
      return request(app.getHttpServer())
        .post('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ screeningId, seatId })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('CONFIRMED');
          expect(res.body.screening).toBeDefined();
          expect(res.body.seat).toBeDefined();
          reservationId = res.body.id;
        });
    });

    it('POST /api/reservations - 동일 좌석 중복 예매 시 409', () => {
      return request(app.getHttpServer())
        .post('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ screeningId, seatId })
        .expect(409);
    });

    it('GET /api/reservations - 내 예매 내역 조회', () => {
      return request(app.getHttpServer())
        .get('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].screening.movie).toBeDefined();
        });
    });

    it('GET /api/reservations - 미인증 시 401', () => {
      return request(app.getHttpServer())
        .get('/api/reservations')
        .expect(401);
    });

    it('PATCH /api/reservations/:id/cancel - 예매 취소 성공', () => {
      return request(app.getHttpServer())
        .patch(`/api/reservations/${reservationId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('CANCELLED');
          expect(res.body.cancelledAt).toBeDefined();
        });
    });

    it('PATCH /api/reservations/:id/cancel - 이미 취소된 예매 재취소 시 400', () => {
      return request(app.getHttpServer())
        .patch(`/api/reservations/${reservationId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('PATCH /api/reservations/:id/cancel - 타인 예매 취소 시 403', async () => {
      // 다른 유저 생성 후 예매
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'other-e2e@example.com', password: 'test1234', name: '타인' });

      const otherLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'other-e2e@example.com', password: 'test1234' });
      const otherToken = otherLogin.body.accessToken;

      // 다른 좌석으로 예매
      const anotherSeat = await request(app.getHttpServer())
        .get(`/api/screenings/${screeningId}/seats`)
        .then((res) => res.body.find((s: any) => !s.isReserved && s.id !== seatId));

      const otherRes = await request(app.getHttpServer())
        .post('/api/reservations')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ screeningId, seatId: anotherSeat.id });

      // 원래 유저가 타인 예매 취소 시도 → 403
      return request(app.getHttpServer())
        .patch(`/api/reservations/${otherRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });
});
