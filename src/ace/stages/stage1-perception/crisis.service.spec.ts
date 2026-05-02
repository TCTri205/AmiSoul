import { Test, TestingModule } from '@nestjs/testing';
import { CrisisService } from './crisis.service';

describe('CrisisService', () => {
  let service: CrisisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrisisService],
    }).compile();

    service = module.get<CrisisService>(CrisisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isCrisis', () => {
    it('should detect direct keywords like "tự tử"', () => {
      expect(service.isCrisis('Tôi muốn tự tử')).toBe(true);
    });

    it('should detect "muốn chết"', () => {
      expect(service.isCrisis('Đời bế tắc quá, tôi muốn chết')).toBe(true);
    });

    it('should detect "nhảy lầu"', () => {
      expect(service.isCrisis('Tôi đang đứng trên sân thượng và định nhảy lầu')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(service.isCrisis('TỰ TỬ')).toBe(true);
    });

    it('should return false for normal messages', () => {
      expect(service.isCrisis('Chào AmiSoul, hôm nay tôi thấy vui')).toBe(false);
      expect(service.isCrisis('Tôi đang học bài')).toBe(false);
    });

    it('should return false for empty or null strings', () => {
      expect(service.isCrisis('')).toBe(false);
      expect(service.isCrisis(null)).toBe(false);
    });
  });

  describe('getSafetyResponse', () => {
    it('should return a string containing hotlines', () => {
      const response = service.getSafetyResponse();
      expect(response).toContain('091.223.3300');
      expect(response).toContain('111');
      expect(response).toContain('🆘');
    });
  });
});
