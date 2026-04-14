import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReservationDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 상영 정보 확인
        const screening = await tx.screening.findUnique({
          where: { id: dto.screeningId },
          include: { screen: true },
        });
        if (!screening) {
          throw new NotFoundException('상영 정보를 찾을 수 없습니다.');
        }

        // 과거 상영 예매 방지
        if (screening.startTime < new Date()) {
          throw new BadRequestException('이미 시작된 상영은 예매할 수 없습니다.');
        }

        // 좌석이 해당 상영관에 속하는지 확인
        const seat = await tx.seat.findUnique({
          where: { id: dto.seatId },
        });
        if (!seat || seat.screenId !== screening.screenId) {
          throw new NotFoundException('해당 상영관의 좌석을 찾을 수 없습니다.');
        }

        // 이미 예매된 좌석인지 확인 (CONFIRMED 상태만) — 빠른 피드백용
        const existingReservation = await tx.reservation.findFirst({
          where: {
            screeningId: dto.screeningId,
            seatId: dto.seatId,
            status: ReservationStatus.CONFIRMED,
          },
        });
        if (existingReservation) {
          throw new ConflictException('이미 예매된 좌석입니다.');
        }

        // 예매 생성
        // DB Partial Unique Index가 동시성 환경에서의 최종 안전장치 역할
        return tx.reservation.create({
          data: {
            userId,
            screeningId: dto.screeningId,
            seatId: dto.seatId,
          },
          include: {
            screening: { include: { movie: true, screen: true } },
            seat: true,
          },
        });
      });
    } catch (error) {
      // DB Partial Unique Index 위반 시 (동시 요청으로 Check를 통과한 경우)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('이미 예매된 좌석입니다.');
      }
      throw error;
    }
  }

  async findMyReservations(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: {
        screening: { include: { movie: true, screen: true } },
        seat: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(userId: string, reservationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new NotFoundException('예매를 찾을 수 없습니다.');
      }
      if (reservation.userId !== userId) {
        throw new ForbiddenException('본인의 예매만 취소할 수 있습니다.');
      }
      if (reservation.status === ReservationStatus.CANCELLED) {
        throw new BadRequestException('이미 취소된 예매입니다.');
      }

      return tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: ReservationStatus.CANCELLED,
          cancelledAt: new Date(),
        },
        include: {
          screening: { include: { movie: true, screen: true } },
          seat: true,
        },
      });
    });
  }
}
