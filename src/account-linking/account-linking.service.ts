import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AccountLinkingService {
  private readonly logger = new Logger(AccountLinkingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
  ) {}

  async linkGuestToAccount(deviceId: string, email: string, code: string) {
    // 1. Verify OTP
    const isOtpValid = await this.otpService.verifyOtp(email, code);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // 2. Find Guest User
    const guestUser = await this.prisma.user.findUnique({
      where: { deviceId },
    });

    if (!guestUser || !guestUser.isGuest) {
      throw new NotFoundException('Guest user not found for this device');
    }

    // 3. Find if formal user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        let finalUser;

        if (existingUser) {
          this.logger.log(`Merging guest ${guestUser.id} into existing user ${existingUser.id}`);
          
          // Merge memories
          await tx.memory.updateMany({
            where: { userId: guestUser.id },
            data: { userId: existingUser.id },
          });

          // Merge sessions
          await tx.session.updateMany({
            where: { userId: guestUser.id },
            data: { userId: existingUser.id },
          });

          // Add bonding score (taking the max)
          await tx.user.update({
            where: { id: existingUser.id },
            data: {
              bondingScore: Math.max(existingUser.bondingScore, guestUser.bondingScore),
            },
          });

          // Delete guest user
          await tx.user.delete({ where: { id: guestUser.id } });
          finalUser = existingUser;
        } else {
          this.logger.log(`Upgrading guest ${guestUser.id} to formal account for ${email}`);
          
          // Convert guest to formal
          finalUser = await tx.user.update({
            where: { id: guestUser.id },
            data: {
              email,
              isGuest: false,
              deviceId: null, // Once linked, it's no longer a "device-only" account
            },
          });
        }

        // 4. Generate new JWT
        const token = await this.authService.generateToken({
          id: finalUser.id,
          email: finalUser.email,
          username: finalUser.username,
          isGuest: false,
        });

        return {
          user: finalUser,
          token,
        };
      });
    } catch (error) {
      this.logger.error(`Account linking failed: ${error.message}`);
      throw new BadRequestException(`Linking failed: ${error.message}`);
    }
  }
}
