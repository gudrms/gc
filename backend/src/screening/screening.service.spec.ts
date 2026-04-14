import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ScreeningService } from './screening.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ScreeningService', () => {
  let service: ScreeningService;

  const mockPrisma = {
    movie: { findUnique: jest.fn() },
    screening: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    seat: { findMany: jest.fn() },
    reservation: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScreeningService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ScreeningService>(ScreeningService);
    jest.clearAllMocks();
  });

  describe('findByMovie', () => {
    it('영화의 상영 시간표를 반환한다', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: 'movie-1' });
      const screenings = [{ id: 's-1', movieId: 'movie-1' }];
      mockPrisma.screening.findMany.mockResolvedValue(screenings);

      const result = await service.findByMovie('movie-1');

      expect(result).toEqual(screenings);
    });

    it('존재하지 않는 영화는 NotFoundException', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue(null);

      await expect(service.findByMovie('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSeats', () => {
    it('좌석 현황에 예매 여부를 포함하여 반환한다', async () => {
      mockPrisma.screening.findUnique.mockResolvedValue({
        id: 's-1',
        screenId: 'scr-1',
        screen: { id: 'scr-1' },
      });
      mockPrisma.seat.findMany.mockResolvedValue([
        { id: 'seat-1', row: 'A', number: 1 },
        { id: 'seat-2', row: 'A', number: 2 },
      ]);
      mockPrisma.reservation.findMany.mockResolvedValue([
        { seatId: 'seat-1' },
      ]);

      const result = await service.getSeats('s-1');

      expect(result).toEqual([
        { id: 'seat-1', row: 'A', number: 1, isReserved: true },
        { id: 'seat-2', row: 'A', number: 2, isReserved: false },
      ]);
    });

    it('존재하지 않는 상영은 NotFoundException', async () => {
      mockPrisma.screening.findUnique.mockResolvedValue(null);

      await expect(service.getSeats('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
