import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

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
}
