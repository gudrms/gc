import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    example: 'screening-uuid',
    description: '상영 ID — GET /api/movies/{movieId}/screenings 응답의 "id" 값',
  })
  @IsString()
  @IsUUID()
  screeningId: string;

  @ApiProperty({
    example: 'seat-uuid',
    description: '좌석 ID — GET /api/screenings/{screeningId}/seats 응답의 "id" 값 (isReserved: false인 좌석만 예매 가능)',
  })
  @IsString()
  @IsUUID()
  seatId: string;
}
