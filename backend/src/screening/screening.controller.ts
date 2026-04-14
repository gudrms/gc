import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScreeningService } from './screening.service';

@ApiTags('상영')
@Controller()
export class ScreeningController {
  constructor(private readonly screeningService: ScreeningService) {}

  @Get('movies/:movieId/screenings')
  @ApiOperation({ summary: '특정 영화의 상영 시간표 조회' })
  @ApiResponse({ status: 200, description: '상영 시간표 반환' })
  @ApiResponse({ status: 404, description: '영화를 찾을 수 없음' })
  findByMovie(@Param('movieId') movieId: string) {
    return this.screeningService.findByMovie(movieId);
  }

  @Get('screenings/:id/seats')
  @ApiOperation({ summary: '특정 상영의 좌석 현황 조회' })
  @ApiResponse({ status: 200, description: '좌석 목록 + 예매 여부 반환' })
  @ApiResponse({ status: 404, description: '상영 정보를 찾을 수 없음' })
  getSeats(@Param('id') id: string) {
    return this.screeningService.getSeats(id);
  }
}
