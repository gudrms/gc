import { Injectable, NotFoundException } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScreeningService {
  constructor(private readonly prisma: PrismaService) {}

  async findByMovie(movieId: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException('영화를 찾을 수 없습니다.');
    }

    return this.prisma.screening.findMany({
      where: { movieId },
      include: {
        screen: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getSeats(screeningId: string) {
    const screening = await this.prisma.screening.findUnique({
      where: { id: screeningId },
      include: { screen: true },
    });
    if (!screening) {
      throw new NotFoundException('상영 정보를 찾을 수 없습니다.');
    }

    const seats = await this.prisma.seat.findMany({
      where: { screenId: screening.screenId },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });

    const reservedSeatIds = await this.prisma.reservation.findMany({
      where: {
        screeningId,
        status: ReservationStatus.CONFIRMED,
      },
      select: { seatId: true },
    });

    const reservedSet = new Set(reservedSeatIds.map((r) => r.seatId));

    return seats.map((seat) => ({
      ...seat,
      isReserved: reservedSet.has(seat.id),
    }));
  }
}
