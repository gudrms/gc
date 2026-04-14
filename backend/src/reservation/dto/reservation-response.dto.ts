import { ApiProperty } from '@nestjs/swagger';

class MovieSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() genre: string;
  @ApiProperty() rating: string;
  @ApiProperty() durationMinutes: number;
}

class ScreenSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

class ScreeningSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() startTime: Date;
  @ApiProperty() endTime: Date;
  @ApiProperty() price: string;
  @ApiProperty({ type: MovieSummaryDto }) movie: MovieSummaryDto;
  @ApiProperty({ type: ScreenSummaryDto }) screen: ScreenSummaryDto;
}

class SeatSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() row: string;
  @ApiProperty() number: number;
}

export class ReservationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ['CONFIRMED', 'CANCELLED'] }) status: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ nullable: true }) cancelledAt: Date | null;
  @ApiProperty({ type: ScreeningSummaryDto }) screening: ScreeningSummaryDto;
  @ApiProperty({ type: SeatSummaryDto }) seat: SeatSummaryDto;
}
