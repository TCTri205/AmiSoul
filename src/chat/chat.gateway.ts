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
import { UserAudioDto, UserImageDto } from './dto/media.dto';

import { Stage0AggregatorService } from '../ace/stages/stage0-aggregator/stage0-aggregator.service';
import { AggregatedMessageBlockDto } from '../ace/stages/stage0-aggregator/dto/aggregated-message-block.dto';
import { MediaProcessingService } from '../ace/stages/stage0-media/media-processing.service';
import { MediaProcessingResultDto } from '../ace/stages/stage0-media/dtos/media-processing-result.dto';
import { MediaErrorDto } from '../ace/stages/stage0-media/dtos/media-error.dto';

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
    private readonly mediaProcessingService: MediaProcessingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  afterInit(server: Server) {
    this.logger.log('ChatGateway initialized');

    // Add Socket.io middleware for connection-level authentication
    server.use(async (socket, next) => {
      try {
        const token = this.extractToken(socket);
        const deviceId =
          socket.handshake.query?.device_id || socket.handshake.auth?.device_id;

        if (token) {
          const payload = await this.authService.validateToken(token);
          if (payload) {
            // Authenticated user
            (socket as any).user = payload;
          } else {
            return next(new Error('Authentication error: Invalid token'));
          }
        } else if (deviceId) {
          // Guest user via Device ID
          const guest = await this.authService.findOrCreateGuest(deviceId as string);
          (socket as any).user = {
            id: guest.id,
            username: guest.username,
            isGuest: true,
          };
        } else {
          return next(new Error('Authentication error: Token or Device_ID not found'));
        }

        // Attach session metadata to socket
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

    // If guest and NO token was provided in handshake, send a JWT for memory-only storage (T5.9)
    const hasToken = !!this.extractToken(client);
    if (user.isGuest && !hasToken) {
      this.authService.generateToken(user).then((token) => {
        client.emit('guest_auth', { token });
      });
    }
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

    // Explicitly emit message_ack to the user's room to support "seen" indicator
    this.server.to(`user:${user.id}`).emit('message_ack', {
      messageId: data.metadata?.messageId || 'buffered',
      status: 'buffered',
      timestamp: new Date().toISOString(),
    });

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

    this.server.to(`user:${payload.userId}`).emit('crisis_response', {
      id: `crisis_${Date.now()}`,
      content: payload.content,
      role: 'assistant',
      metadata: {
        is_crisis: true,
        urgency: 10,
        perception: payload.perception,
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

  @OnEvent('batch_mode.start')
  handleBatchModeStart(payload: { userId: string; message: string }) {
    this.server.to(`user:${payload.userId}`).emit('batch_mode_start', {
      message: payload.message,
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

  @UsePipes(new ValidationPipe())
  @SubscribeMessage('user_audio')
  async handleAudio(@ConnectedSocket() client: Socket, @MessageBody() data: UserAudioDto) {
    const { user } = client as any;
    const sessionType = (client as any).sessionType || SessionType.PERSISTENT;
    this.logger.log(`Audio received from user ${user.id}`);
    
    if (!data.audioBase64) {
      this.server.to(`user:${user.id}`).emit('media_error', { code: 'INVALID_DATA', error: 'No audio data provided' });
      return;
    }

    const base64Length = data.audioBase64.length - (data.audioBase64.indexOf(',') + 1);
    const sizeInBytes = Math.ceil((base64Length * 3) / 4);
    if (sizeInBytes > 26214400) { // 25MB
      this.server.to(`user:${user.id}`).emit('media_error', { code: 'FILE_TOO_LARGE', error: 'File exceeds 25MB limit' });
      return;
    }

    this.mediaProcessingService.processAudio({
      userId: user.id,
      clientId: client.id,
      sessionType: sessionType,
      data: data.audioBase64.split(',')[1] || data.audioBase64,
      mimeType: data.mimeType || 'audio/webm',
    });
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage('user_image')
  async handleImage(@ConnectedSocket() client: Socket, @MessageBody() data: UserImageDto) {
    const { user } = client as any;
    const sessionType = (client as any).sessionType || SessionType.PERSISTENT;
    this.logger.log(`Images received from user ${user.id} (${data.images.length} files)`);
    
    if (!data.images || data.images.length === 0) {
      this.server.to(`user:${user.id}`).emit('media_error', { code: 'INVALID_DATA', error: 'No image data provided' });
      return;
    }

    // Process each image
    data.images.forEach((img, index) => {
      const base64Length = img.length - (img.indexOf(',') + 1);
      const sizeInBytes = Math.ceil((base64Length * 3) / 4);
      
      if (sizeInBytes > 20971520) { // 20MB limit
        this.server.to(`user:${user.id}`).emit('media_error', { 
          code: 'FILE_TOO_LARGE', 
          error: `Image ${index + 1} exceeds 20MB limit` 
        });
        return;
      }

      this.mediaProcessingService.processImage({
        userId: user.id,
        clientId: client.id,
        sessionType: sessionType,
        data: img.split(',')[1] || img,
        mimeType: (data.mimeTypes && data.mimeTypes[index]) || 'image/jpeg',
      });
    });
  }

  @OnEvent('media.processed')
  async handleMediaProcessed(result: MediaProcessingResultDto) {
    const messageData = {
      content: result.processedText,
      metadata: result.metadata,
    };

    // Notify user that media was processed and is now being aggregated
    this.server.to(`user:${result.userId}`).emit('message_ack', {
      status: 'processed',
      mediaType: result.mediaType,
      timestamp: new Date().toISOString(),
    });
    
    await this.aggregatorService.aggregateMessage(
      result.userId, 
      result.clientId, 
      messageData as any, 
      (result.sessionType as SessionType) || SessionType.PERSISTENT
    );
  }

  @OnEvent('media.error')
  handleMediaError(error: MediaErrorDto) {
    this.server.to(`user:${error.userId}`).emit('media_error', error);
  }

  private extractToken(client: Socket): string | null {
    if (client.handshake.auth?.token) return client.handshake.auth.token;
    if (client.handshake.query?.token) return client.handshake.query.token as string;
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
    return null;
  }
}
