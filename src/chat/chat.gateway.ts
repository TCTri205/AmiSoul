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
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from '../auth/auth.service';
import { MessageSentDto, SessionType } from './dto/message.dto';

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
    private readonly eventEmitter: EventEmitter2,
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
        (socket as any).sessionType =
          socket.handshake.auth?.session_type ||
          socket.handshake.query?.session_type ||
          SessionType.PERSISTENT;

        next();
      } catch (error) {
        next(new Error('Authentication error: Internal error'));
      }
    });
  }

  handleConnection(client: Socket) {
    const { user } = client as any;
    const { sessionType } = client as any;
    this.logger.log(
      `Client connected: ${client.id} (User: ${user.username || user.id}, Type: ${sessionType})`,
    );

    // Join a room for the user to easily send messages back to all their devices
    client.join(`user:${user.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage('message_sent')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: MessageSentDto) {
    const startTime = Date.now();
    const { user } = client as any;

    // Use metadata from message if provided, otherwise fallback to session-level metadata
    const sessionType =
      data.metadata?.session_type || (client as any).sessionType || SessionType.PERSISTENT;

    this.logger.log(
      `Message received from ${user.username || user.id}: ${data.content} [${sessionType}]`,
    );

    // Logic for Stage 0 (Aggregator)
    await this.aggregatorService.aggregateMessage(user.id, client.id, data, sessionType);

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
    this.server.to(`user:${payload.userId}`).emit('processing_start', {
      message_count: payload.messages.length,
      session_type: payload.sessionType,
      timestamp: new Date().toISOString(),
    });

    // In T2.1, this will trigger Stage 1: Perception Layer
  }

  @OnEvent('pipeline.safety_override')
  handleSafetyOverride(payload: { userId: string; content: string; perception: any }) {
    this.logger.warn(`Emitting Safety Response for user: ${payload.userId}`);

    this.server.to(`user:${payload.userId}`).emit('ai_response', {
      content: payload.content,
      role: 'system_safety',
      metadata: {
        is_crisis: true,
        urgency: 10,
      },
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('pipeline.security_override')
  handleSecurityOverride(payload: { userId: string; content: string; perception: any }) {
    this.logger.warn(`Emitting Security Warning for user: ${payload.userId}`);

    this.server.to(`user:${payload.userId}`).emit('ai_response', {
      content: payload.content,
      role: 'system_security',
      metadata: {
        is_injection: true,
        urgency: 10,
      },
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('simulation.chunk')
  handleSimulationChunk(payload: {
    userId: string;
    chunk: string;
    isComplete: boolean;
    provider?: string;
    model?: string;
  }) {
    this.server.to(`user:${payload.userId}`).emit('stream_chunk', {
      content: payload.chunk,
      is_complete: payload.isComplete,
      metadata: {
        provider: payload.provider,
        model: payload.model,
      },
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('simulation.completed')
  handleSimulationCompleted(payload: { userId: string; result: any }) {
    this.server.to(`user:${payload.userId}`).emit('stream_end', {
      ...payload.result,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('vibe.update')
  handleVibeUpdate(payload: { userId: string; vibe: string }) {
    this.server.to(`user:${payload.userId}`).emit('vibe_update', {
      vibe: payload.vibe,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('interrupt')
  handleInterrupt(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const { user } = client as any;
    this.logger.warn(`Interrupt received from user ${user.id}`);
    // Trigger preemption logic (T1.6)
    this.eventEmitter.emit('pipeline.interrupt', { userId: user.id, ...data });
  }

  @SubscribeMessage('message_reaction')
  handleReaction(@ConnectedSocket() client: Socket, @MessageBody() data: { messageId: string; emoji: string }) {
    const { user } = client as any;
    this.logger.log(`Reaction received from user ${user.id} for message ${data.messageId}: ${data.emoji}`);
    // Update vibe/bonding (T4.6)
    this.eventEmitter.emit('vibe.reaction', { userId: user.id, ...data });
  }

  private extractToken(client: Socket): string | null {
    if (client.handshake.auth?.token) return client.handshake.auth.token;
    if (client.handshake.query?.token) return client.handshake.query.token as string;
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
    return null;
  }
}
