import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MovieService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.movie.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
    });
    if (!movie) {
      throw new NotFoundException('영화를 찾을 수 없습니다.');
    }
    return movie;
  }
}
