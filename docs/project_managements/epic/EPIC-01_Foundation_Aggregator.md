# [EPIC-01] Foundation & Real-time Aggregator (Stage 0)

## 1. Mô tả
Thiết lập nền tảng kỹ thuật cho dự án AmiSoul và triển khai lớp tiền xử lý tin nhắn (Stage 0). Epic này đảm bảo hệ thống có "xương sống" vững chắc để xử lý luồng dữ liệu thời gian thực (Real-time Pipeline) mà không làm quá tải các mô hình AI phía sau, đồng thời thiết lập môi trường phát triển tối ưu.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [x] Khởi tạo thành công dự án NestJS với TypeScript, ESLint, Prettier.
- [x] Thiết lập Docker Compose chạy PostgreSQL (với pgvector) và Redis.
- [x] Cấu hình Prisma kết nối thành công đến PostgreSQL.
- [x] Triển khai Socket.io Gateway hỗ trợ giao tiếp song hướng (Bi-directional).
- [x] **Stage 0: Debounce & Buffer:** Gom tin nhắn trong cửa sổ 1.5 - 2s (Soft Cap) đến tối đa 4s/10 tin (Hard Cap) vào Redis.
- [x] **Stage 0: Preemption (Hủy ngang):** Sử dụng `AbortController` để dừng Pipeline cũ khi có tin nhắn mới tràn vào Buffer.
- [x] Xử lý các sự kiện cơ bản: `message_sent`, `message_deleted`, `message_reaction` với độ trễ gateway < 50ms.

## 3. Danh sách Tác vụ (Technical Tasks)
- **[T1.1: Khởi tạo Boilerplate & Docker](../ticket/Sprint-01/T1.1_Init_Boilerplate_Docker.md)**
- **[T1.2: Thiết kế Schema Prisma](../ticket/Sprint-01/T1.2_Prisma_Schema_Design.md)**
- **[T1.3: Xây dựng Socket Gateway](../ticket/Sprint-01/T1.3_Socket_Gateway_JWT.md)**
- **[T1.4: MessageAggregatorService](../ticket/Sprint-01/T1.4_Message_Aggregator_Service.md)**
- **[T1.5: Logic Timer Debounce](../ticket/Sprint-01/T1.5_Timer_Debounce_Logic.md)**
- **[T1.6: Tích hợp AbortSignal](../ticket/Sprint-01/T1.6_AbortSignal_Preemption.md)**
- **[T1.7: Unit Test Aggregator](../ticket/Sprint-01/T1.7_Unit_Test_Aggregator.md)**

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Race condition khi nhiều tin nhắn đến cùng lúc làm loạn Buffer.
- **Giảm thiểu:** Sử dụng Redis Transactions (MULTI/EXEC) hoặc Lua Scripts để đảm bảo tính nguyên tử (Atomicity).

## 5. Phụ thuộc (Dependencies)
- **Tài liệu:** [TechnicalArchitecture.md](../../architecture/TechnicalArchitecture.md) (Phần 2.1).
- **Hạ tầng:** Redis (RAM-based storage), PostgreSQL.
