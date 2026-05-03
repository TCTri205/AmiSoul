import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CrisisService {
  private readonly logger = new Logger(CrisisService.name);

  // Crisis Keywords (Vietnamese)
  private readonly CRISIS_PATTERNS = [
    /tự.*(tử|sát|vẫn|kết liễu|hành hạ|làm hại|làm đau)/i,
    /muốn.*chết/i,
    /chết.*cho xong/i,
    /không.*muốn.*sống/i,
    /không.*muốn.*tiếp tục/i,
    /kết thúc.*cuộc đời/i,
    /chấm dứt.*tất cả/i,
    /quyên sinh/i,
    /nhảy.*(lầu|cầu|sông)/i,
    /cắt.*cổ tay/i,
    /treo.*cổ/i,
    /uống.*thuốc ngủ/i,
    /vĩnh biệt/i,
    /từ biệt/i,
    /bế tắc/i,
    /vô vọng/i,
    /không.*còn.*lối thoát/i,
    /muốn.*biến mất/i,
    /tạm biệt.*thế giới/i,
  ];

  /**
   * Detects if the given text contains any crisis-related keywords or patterns.
   */
  isCrisis(text: string): boolean {
    if (!text) return false;

    const isDetected = this.CRISIS_PATTERNS.some((pattern) => pattern.test(text));

    if (isDetected) {
      this.logger.warn(`Crisis detected in text: "${text.substring(0, 50)}..."`);
    }

    return isDetected;
  }

  /**
   * Returns a standard safety response with support hotlines.
   */
  getSafetyResponse(): string {
    return `Tôi nhận thấy bạn đang trải qua những cảm xúc rất khó khăn. Tôi luôn ở đây để lắng nghe, nhưng trong tình huống này, hãy kết nối với những chuyên gia có thể hỗ trợ bạn tốt nhất ngay lập tức:

🆘 **Đường dây nóng Ngày Mai (Hỗ trợ tâm lý & ngăn ngừa tự tử):** [091.223.3300](tel:0912233300)
🆘 **Tổng đài Quốc gia Bảo vệ Trẻ em:** [111](tel:111)

Bạn không cô đơn. Hãy cho bản thân một cơ hội để được giúp đỡ nhé.`;
  }
}
