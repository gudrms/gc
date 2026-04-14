import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@ApiTags('예매')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좌석 예매' })
  @ApiResponse({ status: 201, description: '예매 성공' })
  @ApiResponse({ status: 409, description: '이미 예매된 좌석' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationService.create(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 예매 내역 조회' })
  @ApiResponse({ status: 200, description: '예매 내역 반환' })
  findMyReservations(@CurrentUser() user: { id: string }) {
    return this.reservationService.findMyReservations(user.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '예매 취소' })
  @ApiResponse({ status: 200, description: '예매 취소 성공' })
  @ApiResponse({ status: 404, description: '예매를 찾을 수 없음' })
  cancel(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.reservationService.cancel(user.id, id);
  }
}
