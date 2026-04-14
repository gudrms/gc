import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MovieService } from './movie.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MovieService', () => {
  let service: MovieService;

  const mockPrisma = {
    movie: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('영화 목록을 반환한다', async () => {
      const movies = [
        { id: '1', title: '영화1', genre: '액션', durationMinutes: 120, rating: '15세' },
        { id: '2', title: '영화2', genre: '코미디', durationMinutes: 90, rating: '전체' },
      ];
      mockPrisma.movie.findMany.mockResolvedValue(movies);

      const result = await service.findAll();

      expect(result).toEqual(movies);
      expect(mockPrisma.movie.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('존재하는 영화를 반환한다', async () => {
      const movie = { id: '1', title: '영화1' };
      mockPrisma.movie.findUnique.mockResolvedValue(movie);

      const result = await service.findOne('1');

      expect(result).toEqual(movie);
    });

    it('존재하지 않는 영화는 NotFoundException', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
