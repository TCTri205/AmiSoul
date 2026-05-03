import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { AuthService } from '../auth/auth.service';
import { Stage0AggregatorService } from '../ace/stages/stage0-aggregator/stage0-aggregator.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Server } from 'socket.io';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let eventEmitter: EventEmitter2;

  const mockAuthService = {};
  const mockAggregatorService = {};
  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Stage0AggregatorService, useValue: mockAggregatorService },
        { provide: EventEmitter2, useValue: new EventEmitter2() },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    (gateway as any).server = mockServer;
  });

  it('should emit crisis_response when pipeline.safety_override is triggered', () => {
    const payload = {
      userId: 'user-123',
      content: 'Safety response',
      perception: { mood: 'crisis' },
    };

    gateway.handleSafetyOverride(payload);

    expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
    expect(mockServer.emit).toHaveBeenCalledWith('crisis_response', expect.objectContaining({
      content: 'Safety response',
      metadata: expect.objectContaining({
        is_crisis: true,
      }),
    }));
  });
});
