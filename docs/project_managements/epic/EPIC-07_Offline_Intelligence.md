# [EPIC-07] Offline Intelligence & Memory Management (Stage 5)

## 1. Mô tả
Triển khai hệ thống xử lý hậu kỳ (Stage 5) chạy bất đối xứng thông qua Workers. Đây là giai đoạn "tiêu hóa" và "củng cố" dữ liệu sau khi phiên trò chuyện kết thúc, giúp AmiSoul tự học hỏi, nén ký ức để tối ưu bộ nhớ và cập nhật các chỉ số dài hạn mà không làm ảnh hưởng đến hiệu năng thời gian thực.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] **BullMQ Infrastructure:** Thiết lập thành công Redis Queue và cụm Workers xử lý Job tách biệt với Main Thread.
- [ ] **Memory Compression:** Nén log đàm thoại thô thành các `Episodic Nodes` súc tích (giảm > 70% số lượng tokens) bằng Gemini Flash.
- [ ] **Vector Embedding:** Ký ức sau khi nén được nhúng (Embedding) và lưu vào `pgvector` với đầy đủ metadata cảm xúc.
- [ ] **Redis Cleanup:** Tự động giải phóng RAM Redis (`buffer`, `raw_logs`, `session_vibe`) sau 30 phút người dùng không hoạt động.
- [ ] **Consistency Check:** Đảm bảo dữ liệu giữa Redis (L1) và PostgreSQL (L2) được đồng bộ hóa hoàn toàn sau khi Job kết thúc.

## 3. Danh sách Tác vụ (Technical Tasks)
- **T7.1:** Thiết lập BullMQ Module trong NestJS và cấu hình Dashboard giám sát Queue (Bull Board).
- **T7.2:** Xây dựng Worker `MemoryCompressionJob` sử dụng LLM để tóm tắt hội thoại theo phong cách "ký ức tự sự".
- **T7.3:** Triển khai `ConsolidationService` để điều phối thứ tự các Job: Nén ký ức -> Tính Bonding -> Cập nhật Persona.
- **T7.4:** Xây dựng logic `Knowledge Linking`: Tự động tìm kiếm và liên kết các ký ức mới với ký ức cũ có cùng chủ đề để tạo đồ thị tri thức (Knowledge Graph) đơn giản.
- **T7.5:** Triển khai cơ chế `Conflict Resolution` và xử lý yêu cầu `Right to be Forgotten` (Xóa ký ức theo yêu cầu).
- **T7.6:** Xây dựng Scheduler Job để quét và dọn dẹp các Session quá hạn và thực thi lệnh xóa PII (Personally Identifiable Information).
- **T7.7:** Viết Unit Test cho Worker xử lý nén ký ức với các mẫu log dài (> 50 tin nhắn).

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Workers bị quá tải khi nhiều người dùng kết thúc session cùng lúc.
- **Giảm thiểu:** Cấu hình `concurrency` của BullMQ linh hoạt và sử dụng cơ chế `priority queuing` cho các session quan trọng.

## 5. Phụ thuộc (Dependencies)
- **Epic:** [EPIC-06] (Để lấy Raw Logs).
- **Tài liệu:** [TechnicalArchitecture.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/TechnicalArchitecture.md) (Phần 4.0).
