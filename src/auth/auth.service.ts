import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      return null;
    }
  }

  // Temporary helper to generate token for testing
  async generateToken(payload: any) {
    return this.jwtService.sign(payload);
  }

  async findOrCreateGuest(deviceId: string) {
    let user = await this.prisma.user.findUnique({
      where: { deviceId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          deviceId,
          isGuest: true,
          username: `Guest_${deviceId.slice(0, 8)}`,
        },
      });
    }

    return user;
  }
}
