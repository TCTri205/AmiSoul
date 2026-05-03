import { Test, TestingModule } from '@nestjs/testing';
import { TimeAnomalyService } from './time-anomaly.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('TimeAnomalyService', () => {
  let service: TimeAnomalyService;
  let prisma: PrismaService;

  const mockPrismaService = {
    behavioralBaseline: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeAnomalyService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<TimeAnomalyService>(TimeAnomalyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isLateNight', () => {
    it('should return true for 23:00', () => {
      const date = new Date('2026-05-03T23:00:00');
      expect(service.isLateNight(date)).toBe(true);
    });

    it('should return true for 02:00', () => {
      const date = new Date('2026-05-03T02:00:00');
      expect(service.isLateNight(date)).toBe(true);
    });

    it('should return false for 10:00', () => {
      const date = new Date('2026-05-03T10:00:00');
      expect(service.isLateNight(date)).toBe(false);
    });

    it('should return false for 22:59', () => {
      const date = new Date('2026-05-03T22:59:59');
      expect(service.isLateNight(date)).toBe(false);
    });
  });

  describe('checkAnomaly', () => {
    it('should return Late_Night if isLateNight is true', async () => {
      const date = new Date('2026-05-03T23:30:00');
      const result = await service.checkAnomaly('user1', date);
      expect(result).toBe('Late_Night');
    });

    it('should return Habit_Deviation if timestamp is outside normal baseline', async () => {
      const date = new Date('2026-05-03T06:30:00'); // Late night is false
      mockPrismaService.behavioralBaseline.findUnique.mockResolvedValue({
        typicalActiveStart: 9,
        typicalActiveEnd: 18,
      });

      const result = await service.checkAnomaly('user1', date);
      expect(result).toBe('Habit_Deviation');
    });

    it('should return Habit_Deviation if timestamp is outside overnight baseline', async () => {
      const date = new Date('2026-05-03T12:00:00');
      mockPrismaService.behavioralBaseline.findUnique.mockResolvedValue({
        typicalActiveStart: 22,
        typicalActiveEnd: 6,
      });

      const result = await service.checkAnomaly('user1', date);
      expect(result).toBe('Habit_Deviation');
    });

    it('should return false if within baseline and not late night', async () => {
      const date = new Date('2026-05-03T10:00:00');
      mockPrismaService.behavioralBaseline.findUnique.mockResolvedValue({
        typicalActiveStart: 8,
        typicalActiveEnd: 22,
      });

      const result = await service.checkAnomaly('user1', date);
      expect(result).toBe(false);
    });

    it('should return false if no baseline exists and not late night', async () => {
      const date = new Date('2026-05-03T10:00:00');
      mockPrismaService.behavioralBaseline.findUnique.mockResolvedValue(null);

      const result = await service.checkAnomaly('user1', date);
      expect(result).toBe(false);
    });
  });
});
