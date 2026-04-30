# [EPIC-01] Foundation & Real-time Aggregator (Stage 0)

## 1. Mô tả
Thiết lập nền tảng kỹ thuật cho dự án AmiSoul và triển khai lớp tiền xử lý tin nhắn (Stage 0). Epic này đảm bảo hệ thống có "xương sống" vững chắc để xử lý luồng dữ liệu thời gian thực (Real-time Pipeline) mà không làm quá tải các mô hình AI phía sau, đồng thời thiết lập môi trường phát triển tối ưu.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] Khởi tạo thành công dự án NestJS với TypeScript, ESLint, Prettier.
- [ ] Thiết lập Docker Compose chạy PostgreSQL (với pgvector) và Redis.
- [ ] Cấu hình Prisma kết nối thành công đến PostgreSQL.
- [ ] Triển khai Socket.io Gateway hỗ trợ giao tiếp song hướng (Bi-directional).
- [ ] **Stage 0: Debounce & Buffer:** Gom tin nhắn trong cửa sổ 2.5s (Soft Cap) đến tối đa 8s (Hard Cap) vào Redis.
- [ ] **Stage 0: Preemption (Hủy ngang):** Sử dụng `AbortController` để dừng Pipeline cũ khi có tin nhắn mới tràn vào Buffer.
- [ ] Xử lý các sự kiện cơ bản: `message_sent`, `message_deleted`, `message_reaction` với độ trễ gateway < 50ms.

## 3. Danh sách Tác vụ (Technical Tasks)
- **T1.1:** Khởi tạo Boilerplate NestJS và cấu hình Multi-stage Dockerfile.
- **T1.2:** Thiết kế Schema Prisma cho các bảng core: `User`, `Account`, `Session` (thêm flag `is_incognito`), `Message`.
- **T1.3:** Xây dựng Socket Gateway với Middleware xác thực JWT và hỗ trợ metadata `session_type`.
- **T1.4:** Triển khai `MessageAggregatorService` hỗ trợ điều phối logic Incognito (không lưu cache lâu dài).
- **T1.5:** Triển khai logic Timer quản lý Debounce Window trong Node.js Memory phối hợp với Redis TTL.
- **T1.6:** Tích hợp `AbortSignal` truyền qua toàn bộ Pipeline (Stage 1-4) để hỗ trợ logic ngắt dòng xử lý.
- **T1.7:** Viết Unit Test cho logic gom tin (Aggregator) và ngắt dòng (Preemption).

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Race condition khi nhiều tin nhắn đến cùng lúc làm loạn Buffer.
- **Giảm thiểu:** Sử dụng Redis Transactions (MULTI/EXEC) hoặc Lua Scripts để đảm bảo tính nguyên tử (Atomicity).

## 5. Phụ thuộc (Dependencies)
- **Tài liệu:** [TechnicalArchitecture.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/TechnicalArchitecture.md) (Phần 2.1).
- **Hạ tầng:** Redis (RAM-based storage), PostgreSQL.
