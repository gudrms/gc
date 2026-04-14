import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReservationService', () => {
  let service: ReservationService;

  const mockTx = {
    screening: { findUnique: jest.fn() },
    seat: { findUnique: jest.fn() },
    reservation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPrisma = {
    $transaction: jest.fn((cb) => cb(mockTx)),
    reservation: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'user-1';
    const dto = { screeningId: 's-1', seatId: 'seat-1' };

    it('예매 성공', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      mockTx.screening.findUnique.mockResolvedValue({
        id: 's-1',
        screenId: 'scr-1',
        startTime: futureDate,
        screen: { id: 'scr-1' },
      });
      mockTx.seat.findUnique.mockResolvedValue({
        id: 'seat-1',
        screenId: 'scr-1',
      });
      mockTx.reservation.findFirst.mockResolvedValue(null);
      mockTx.reservation.create.mockResolvedValue({
        id: 'res-1',
        userId,
        screeningId: 's-1',
        seatId: 'seat-1',
        status: 'CONFIRMED',
      });

      const result = await service.create(userId, dto);

      expect(result.status).toBe('CONFIRMED');
    });

    it('이미 예매된 좌석은 ConflictException', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      mockTx.screening.findUnique.mockResolvedValue({
        id: 's-1',
        screenId: 'scr-1',
        startTime: futureDate,
        screen: { id: 'scr-1' },
      });
      mockTx.seat.findUnique.mockResolvedValue({
        id: 'seat-1',
        screenId: 'scr-1',
      });
      mockTx.reservation.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(userId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('과거 상영은 BadRequestException', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      mockTx.screening.findUnique.mockResolvedValue({
        id: 's-1',
        screenId: 'scr-1',
        startTime: pastDate,
        screen: { id: 'scr-1' },
      });

      await expect(service.create(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findMyReservations', () => {
    it('본인 예매 내역을 반환한다', async () => {
      const reservations = [
        {
          id: 'res-1',
          userId: 'user-1',
          status: 'CONFIRMED',
          screening: { movie: { title: '인터스텔라' }, screen: { name: '1관' } },
          seat: { row: 'A', number: 1 },
        },
      ];
      mockPrisma.reservation.findMany.mockResolvedValue(reservations);

      const result = await service.findMyReservations('user-1');

      expect(result).toEqual(reservations);
      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('예매가 없으면 빈 배열을 반환한다', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      const result = await service.findMyReservations('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('cancel', () => {
    it('본인 예매 취소 성공', async () => {
      mockTx.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });
      mockTx.reservation.update.mockResolvedValue({
        id: 'res-1',
        status: 'CANCELLED',
      });

      const result = await service.cancel('user-1', 'res-1');

      expect(result.status).toBe('CANCELLED');
    });

    it('타인의 예매 취소 시 ForbiddenException', async () => {
      mockTx.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        userId: 'other-user',
        status: 'CONFIRMED',
      });

      await expect(service.cancel('user-1', 'res-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('이미 취소된 예매는 BadRequestException', async () => {
      mockTx.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        userId: 'user-1',
        status: 'CANCELLED',
      });

      await expect(service.cancel('user-1', 'res-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
