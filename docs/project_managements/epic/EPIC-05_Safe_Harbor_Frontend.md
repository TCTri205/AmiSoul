# [EPIC-05] Safe Harbor Frontend & Real-time Integration

## 1. Mô tả
Xây dựng giao diện người dùng (Safe Harbor) tối giản, ấm áp và mang lại cảm giác an toàn. EPIC này tập trung vào trải nghiệm người dùng phía Client (Web App), tích hợp luồng streaming tin nhắn thời gian thực và các hiệu ứng cảm xúc động.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] **Custom Theme:** Giao diện pastel, typography hiện đại (Inter/Outfit), hỗ trợ Dark Mode.
- [ ] **Real-time Streaming:** Hiển thị tin nhắn dạng stream (từng chữ) mượt mà qua Socket.io.
- [ ] **Vibe Background:** Nền ứng dụng thay đổi màu sắc (Gradient) dựa trên `Session_Vibe` của AI.
- [ ] **Haptic Feedback:** Giả lập rung hoặc hiệu ứng thị giác khi AI gửi các tin nhắn mang tính cảm xúc mạnh.
- [ ] **Local Persistence:** Lưu trữ tạm thời lịch sử chat tại trình duyệt để tránh gián đoạn khi mất mạng.

## 3. Danh sách Tác vụ (Technical Tasks)
- **[T5.1: Next.js Custom Theme](../ticket/Sprint-05/T5.1_Nextjs_Custom_Theme.md)**
- **[T5.2: Socket Provider Context](../ticket/Sprint-05/T5.2_Socket_Provider_Context.md)**
- **[T5.3: Message Bubble Streaming](../ticket/Sprint-05/T5.3_Message_Bubble_Streaming.md)**
- **[T5.4: Vibe Background Gradients](../ticket/Sprint-05/T5.4_Vibe_Background_Gradients.md)**
- **[T5.5: Local Cache Service](../ticket/Sprint-05/T5.5_Local_Cache_Service.md)**
- **[T5.6: Haptic Feedback Simulation](../ticket/Sprint-05/T5.6_Haptic_Feedback_Simulation.md)**
- **[T5.7: Mobile Responsive Design](../ticket/Sprint-05/T5.7_Mobile_Responsive_Design.md)**
- **[T5.8: E2E Message Flow Test](../ticket/Sprint-05/T5.8_E2E_Message_Flow_Test.md)**
- **[T5.9: Auth-less Onboarding UI](../ticket/Sprint-05/T5.9_Auth_Less_Onboarding.md)**
- **[T5.10: Media Input & Preemption UI](../ticket/Sprint-05/T5.10_Media_Input_Preemption.md)**
- **[T5.13: UI: Settings Page & Privacy Controls](../ticket/Sprint-05/T5.13_Settings_Privacy_UI.md)**

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Streaming bị gián đoạn do kết nối mạng kém.
- **Giảm thiểu:** Triển khai cơ chế Reconnection tự động trong SocketProvider và Buffer tin nhắn tại Client.

## 5. Phụ thuộc (Dependencies)
- **Backend:** Socket Gateway (Sprint 01) và Simulation Service (Sprint 04).
