import { Test, TestingModule } from '@nestjs/testing';
import { AccountLinkingService } from './account-linking.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { AuthService } from '../auth/auth.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AccountLinkingService', () => {
  let service: AccountLinkingService;
  let prisma: PrismaService;
  let otpService: OtpService;
  let authService: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    memory: {
      updateMany: jest.fn(),
    },
    session: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockOtpService = {
    verifyOtp: jest.fn(),
  };

  const mockAuthService = {
    generateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountLinkingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<AccountLinkingService>(AccountLinkingService);
    prisma = module.get<PrismaService>(PrismaService);
    otpService = module.get<OtpService>(OtpService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('linkGuestToAccount', () => {
    it('should throw BadRequestException if OTP is invalid', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(false);

      await expect(service.linkGuestToAccount('device123', 'test@example.com', '123456'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if guest user not found', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.linkGuestToAccount('device123', 'test@example.com', '123456'))
        .rejects.toThrow(NotFoundException);
    });

    it('should upgrade guest to formal if no existing user', async () => {
      const guestUser = { id: 'guest-id', deviceId: 'device123', isGuest: true, bondingScore: 10 };
      const email = 'test@example.com';

      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(guestUser) // for deviceId
        .mockResolvedValueOnce(null); // for email
      
      mockPrismaService.user.update.mockResolvedValue({ ...guestUser, email, isGuest: false });
      mockAuthService.generateToken.mockResolvedValue('new-token');

      const result = await service.linkGuestToAccount('device123', email, '123456');

      expect(result.token).toBe('new-token');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: guestUser.id },
          data: expect.objectContaining({ email, isGuest: false }),
        })
      );
    });

    it('should merge guest into existing user', async () => {
      const guestUser = { id: 'guest-id', deviceId: 'device123', isGuest: true, bondingScore: 10 };
      const existingUser = { id: 'user-id', email: 'test@example.com', isGuest: false, bondingScore: 5 };

      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(guestUser) // for deviceId
        .mockResolvedValueOnce(existingUser); // for email

      mockAuthService.generateToken.mockResolvedValue('merged-token');

      const result = await service.linkGuestToAccount('device123', 'test@example.com', '123456');

      expect(result.token).toBe('merged-token');
      expect(mockPrismaService.memory.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: guestUser.id }, data: { userId: existingUser.id } })
      );
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({ where: { id: guestUser.id } });
    });
  });
});
