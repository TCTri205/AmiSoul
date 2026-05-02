import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      this.logger.error('No token found in handshake');
      throw new WsException('Unauthorized');
    }

    const payload = await this.authService.validateToken(token);
    if (!payload) {
      this.logger.error('Invalid token');
      throw new WsException('Unauthorized');
    }

    // Attach user to client for later use
    (client as any).user = payload;
    return true;
  }

  private extractToken(client: Socket): string | null {
    // Check handshake.auth (modern socket.io)
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }
    // Check handshake.query (older approach or fallback)
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }
    // Check headers
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    return null;
  }
}
