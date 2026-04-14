import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
    };

    it('신규 회원가입 성공', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: signupDto.email,
        name: signupDto.name,
        password: 'hashed',
      });

      const result = await service.signup(signupDto);

      expect(result).toEqual({
        id: 'uuid-1',
        email: signupDto.email,
        name: signupDto.name,
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: signupDto.email,
          password: expect.any(String),
          name: signupDto.name,
        },
      });
    });

    it('이메일 중복 시 ConflictException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.signup(signupDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('로그인 성공 시 JWT 토큰 반환', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: loginDto.email,
        name: '홍길동',
        password: hashedPassword,
      });

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe(loginDto.email);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-1',
        email: loginDto.email,
      });
    });

    it('존재하지 않는 이메일 시 UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('비밀번호 불일치 시 UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: loginDto.email,
        password: await bcrypt.hash('wrongpassword', 10),
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
