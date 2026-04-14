import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MovieService } from './movie.service';

@ApiTags('영화')
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @ApiOperation({ summary: '영화 목록 조회' })
  @ApiResponse({ status: 200, description: '영화 목록 반환' })
  findAll() {
    return this.movieService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '영화 상세 조회' })
  @ApiResponse({ status: 200, description: '영화 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '영화를 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.movieService.findOne(id);
  }
}
