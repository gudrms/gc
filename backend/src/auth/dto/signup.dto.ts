import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: '비밀번호 (6자 이상)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '홍길동', description: '이름' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
