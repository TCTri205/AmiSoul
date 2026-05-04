import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AccountLinkingService {
  private readonly logger = new Logger(AccountLinkingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async linkGuestToAccount(deviceId: string, emailAuthToken: string) {
    // 1. Verify Email Auth Token
    const email = await this.authService.verifyEmailVerificationToken(emailAuthToken);
    if (!email) {
      throw new BadRequestException('Invalid or expired email authentication token');
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

          // Handle Behavioral Baseline
          const guestBaseline = await tx.behavioralBaseline.findUnique({
            where: { userId: guestUser.id },
          });
          const existingBaseline = await tx.behavioralBaseline.findUnique({
            where: { userId: existingUser.id },
          });

          if (guestBaseline && !existingBaseline) {
            await tx.behavioralBaseline.update({
              where: { id: guestBaseline.id },
              data: { userId: existingUser.id },
            });
          }

          // Update existing user: Max bonding score and take DPE if existing is null
          await tx.user.update({
            where: { id: existingUser.id },
            data: {
              bondingScore: Math.max(existingUser.bondingScore, guestUser.bondingScore),
              dpe: existingUser.dpe || guestUser.dpe,
              username: existingUser.username || guestUser.username,
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
