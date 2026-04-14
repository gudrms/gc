import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: 'screening-uuid', description: '상영 ID' })
  @IsString()
  @IsUUID()
  screeningId: string;

  @ApiProperty({ example: 'seat-uuid', description: '좌석 ID' })
  @IsString()
  @IsUUID()
  seatId: string;
}
