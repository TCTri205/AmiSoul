import { Test, TestingModule } from '@nestjs/testing';
import { AccountLinkingService } from './account-linking.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AccountLinkingService', () => {
  let service: AccountLinkingService;
  let prisma: PrismaService;
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
    behavioralBaseline: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockAuthService = {
    generateToken: jest.fn(),
    verifyEmailVerificationToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountLinkingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<AccountLinkingService>(AccountLinkingService);
    prisma = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('linkGuestToAccount', () => {
    it('should throw BadRequestException if token is invalid', async () => {
      mockAuthService.verifyEmailVerificationToken.mockResolvedValue(null);

      await expect(service.linkGuestToAccount('device123', 'invalid-token'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if guest user not found', async () => {
      mockAuthService.verifyEmailVerificationToken.mockResolvedValue('test@example.com');
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.linkGuestToAccount('device123', 'valid-token'))
        .rejects.toThrow(NotFoundException);
    });

    it('should upgrade guest to formal if no existing user', async () => {
      const guestUser = { id: 'guest-id', deviceId: 'device123', isGuest: true, bondingScore: 10 };
      const email = 'test@example.com';

      mockAuthService.verifyEmailVerificationToken.mockResolvedValue(email);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(guestUser) // for deviceId
        .mockResolvedValueOnce(null); // for email
      
      mockPrismaService.behavioralBaseline.findUnique.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue({ ...guestUser, email, isGuest: false });
      mockAuthService.generateToken.mockResolvedValue('new-token');

      const result = await service.linkGuestToAccount('device123', 'valid-token');

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

      mockAuthService.verifyEmailVerificationToken.mockResolvedValue('test@example.com');
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(guestUser) // for deviceId
        .mockResolvedValueOnce(existingUser); // for email

      mockPrismaService.behavioralBaseline.findUnique.mockResolvedValue(null);
      mockAuthService.generateToken.mockResolvedValue('merged-token');

      const result = await service.linkGuestToAccount('device123', 'valid-token');

      expect(result.token).toBe('merged-token');
      expect(mockPrismaService.memory.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: guestUser.id }, data: { userId: existingUser.id } })
      );
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({ where: { id: guestUser.id } });
    });
  });
});
