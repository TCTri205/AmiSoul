import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: PrismaService;

  const mockPrismaService = {
    otpVerification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') return 'development';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('should create an OTP record and return true', async () => {
      const email = 'test@example.com';
      mockPrismaService.otpVerification.create.mockResolvedValue({});

      const result = await service.sendOtp(email);

      expect(result).toBe(true);
      expect(mockPrismaService.otpVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email,
            codeHash: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('verifyOtp', () => {
    it('should return true for a valid OTP', async () => {
      const email = 'test@example.com';
      const code = '123456';
      const codeHash = await bcrypt.hash(code, 10);

      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        id: 'otp-id',
        email,
        codeHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 10000),
      });

      const result = await service.verifyOtp(email, code);

      expect(result).toBe(true);
      expect(mockPrismaService.otpVerification.delete).toHaveBeenCalledWith({
        where: { id: 'otp-id' },
      });
    });

    it('should return false and increment attempts for an invalid OTP', async () => {
      const email = 'test@example.com';
      const code = '123456';
      const wrongCode = '654321';
      const codeHash = await bcrypt.hash(code, 10);

      mockPrismaService.otpVerification.findFirst.mockResolvedValue({
        id: 'otp-id',
        email,
        codeHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 10000),
      });

      const result = await service.verifyOtp(email, wrongCode);

      expect(result).toBe(false);
      expect(mockPrismaService.otpVerification.update).toHaveBeenCalledWith({
        where: { id: 'otp-id' },
        data: { attempts: { increment: 1 } },
      });
    });
  });
});
