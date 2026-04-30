# [EPIC-05] Safe Harbor Frontend & Real-time Integration

## 1. Mô tả
Xây dựng giao diện người dùng (Web App) theo triết lý "Safe Harbor" - Cảng tránh bão an toàn. Giao diện này không chỉ là công cụ nhắn tin mà còn là một không gian cảm xúc, giúp người dùng cảm thấy được lắng nghe và vỗ về thông qua các tín hiệu thị giác tinh tế và tương tác thời gian thực.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] Khởi tạo thành công dự án Frontend sử dụng Next.js (App Router) và Tailwind CSS.
- [ ] **Real-time Synchronization:** Kết nối Socket.io với khả năng tự động Reconnect và đồng bộ trạng thái (Online/Offline).
- [ ] **Streaming UI:** Tin nhắn từ AI hiển thị theo kiểu "dòng chảy" mượt mà, hỗ trợ cả Markdown cơ bản (Bold, Italic, List).
- [ ] **Vibe Indicators:** Giao diện thay đổi nhẹ nhàng (màu nền, hiệu ứng gradient) dựa trên `Session_Vibe` nhận từ Stage 4.
- [ ] **Status Feedback:** Hiển thị rõ ràng các trạng thái của AI: `Typing` (Đang gõ), `Deep Thinking` (Đang xử lý phức tạp), `Recalling` (Đang nhớ lại).
- [ ] **Natural Onboarding:** Hoàn thiện luồng giới thiệu bản thân thông qua hội thoại (AI-led onboarding) thay vì form đăng ký truyền thống.

## 3. Danh sách Tác vụ (Technical Tasks)
- **T5.1:** Cấu hình Next.js với Custom Theme (màu sắc pastel, font chữ Inter/Roboto tối ưu cho tiếng Việt).
- **T5.2:** Xây dựng `SocketProvider` sử dụng Context API để quản lý kết nối Socket.io toàn ứng dụng.
- **T5.3:** Triển khai Component `MessageBubble` với hiệu ứng xuất hiện (Framer Motion) và xử lý Streaming text.
- **T5.4:** Thiết kế `VibeBackground`: Component nền sử dụng CSS Gradients động thay đổi theo Sentiment score.
- **T5.5:** Xây dựng logic `LocalCacheService` để lưu trữ tạm thời tin nhắn trong phiên làm việc (Local Storage).
- **T5.6:** Triển khai `HapticFeedback` giả lập (vibration nhẹ hoặc hiệu ứng âm thanh nhỏ) khi AI gửi tin nhắn quan trọng.
- **T5.7:** Tích hợp Responsive Design cho Mobile Web (Ưu tiên trải nghiệm một tay).
- **T5.8:** Viết E2E Test cơ bản cho luồng gửi/nhận tin nhắn (sử dụng Playwright hoặc Cypress).

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Kết nối mạng yếu làm ngắt quãng stream tin nhắn.
- **Giảm thiểu:** Triển khai cơ chế Buffering phía client và hiển thị thông báo "Kết nối lại..." một cách thân thiện.

## 5. Phụ thuộc (Dependencies)
- **Epic:** [EPIC-01] (Backend Gateway).
- **Tài liệu:** [SRS.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/SRS.md) (Phần 4.0), [TechStack.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/TechStack.md).
