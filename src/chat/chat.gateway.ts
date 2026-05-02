import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MessageSentDto, SessionType } from './dto/message.dto';

import { OnEvent } from '@nestjs/event-emitter';
import { Stage0AggregatorService } from '../ace/stages/stage0-aggregator/stage0-aggregator.service';
import { AggregatedMessageBlockDto } from '../ace/stages/stage0-aggregator/dto/aggregated-message-block.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly aggregatorService: Stage0AggregatorService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('ChatGateway initialized');
    
    // Add Socket.io middleware for connection-level authentication
    server.use(async (socket, next) => {
      try {
        const token = this.extractToken(socket);
        if (!token) {
          return next(new Error('Authentication error: Token not found'));
        }

        const payload = await this.authService.validateToken(token);
        if (!payload) {
          return next(new Error('Authentication error: Invalid token'));
        }

        // Attach user and session metadata to socket
        (socket as any).user = payload;
        (socket as any).sessionType = socket.handshake.auth?.session_type || 
                                     socket.handshake.query?.session_type || 
                                     SessionType.PERSISTENT;
        
        next();
      } catch (error) {
        next(new Error('Authentication error: Internal error'));
      }
    });
  }

  handleConnection(client: Socket) {
    const user = (client as any).user;
    const sessionType = (client as any).sessionType;
    this.logger.log(`Client connected: ${client.id} (User: ${user.username || user.id}, Type: ${sessionType})`);
    
    // Join a room for the user to easily send messages back to all their devices
    client.join(`user:${user.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage('message_sent')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageSentDto,
  ) {
    const startTime = Date.now();
    const user = (client as any).user;
    
    // Use metadata from message if provided, otherwise fallback to session-level metadata
    const sessionType = data.metadata?.session_type || (client as any).sessionType || SessionType.PERSISTENT;
    
    this.logger.log(`Message received from ${user.username || user.id}: ${data.content} [${sessionType}]`);

    // Logic for Stage 0 (Aggregator)
    await this.aggregatorService.aggregateMessage(user.id, data, sessionType);

    const duration = Date.now() - startTime;
    this.logger.log(`Gateway processing time: ${duration}ms`);

    return {
      status: 'buffered',
      timestamp: new Date().toISOString(),
      latency: duration,
      session_type: sessionType,
    };
  }

  @OnEvent('stage0.aggregated')
  handleAggregatedBlock(payload: AggregatedMessageBlockDto) {
    this.logger.log(`Broadcasting processing status for user: ${payload.userId}`);
    
    // Notify the user that AmiSoul is processing the aggregated block
    this.server.to(`user:${payload.userId}`).emit('processing_started', {
      message_count: payload.messages.length,
      session_type: payload.sessionType,
      timestamp: new Date().toISOString(),
    });
    
    // In T2.1, this will trigger Stage 1: Perception Layer
  }

  private extractToken(client: Socket): string | null {
    if (client.handshake.auth?.token) return client.handshake.auth.token;
    if (client.handshake.query?.token) return client.handshake.query.token as string;
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
    return null;
  }
}
