# [EPIC-06] Empathy Safety & Vibe Monitoring (Stage 4)

## 1. Mô tả
Triển khai lớp giám sát cuối cùng (Stage 4) để đảm bảo mọi phản hồi của AI trước khi gửi đến người dùng đều đạt tiêu chuẩn an toàn, giữ đúng bản sắc Ami và cập nhật trạng thái cảm xúc của phiên làm việc (Session Vibe) vào hệ thống lưu trữ đệm.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] **Safety Shield:** Stage 4 Monitor chặn 100% các nội dung độc hại, vi phạm đạo đức hoặc chính sách bảo mật thông qua Heuristic & Regex.
- [ ] **Session Vibe Accumulation:** Tính toán và cập nhật biến `Session_Vibe` (Real-time sentiment score) vào Redis sau mỗi lượt tương tác thành công.
- [ ] **Persona Shield:** Phát hiện và ngăn chặn các phản hồi bị "out of character" hoặc bị AI "hallucinate" về danh tính.
- [ ] **Log Buffering:** Ghi log toàn bộ Pipeline (Stage 0-4) vào Redis `raw_logs:{session_id}` để Stage 5 xử lý.
- [ ] Độ trễ xử lý của Stage 4 phải < 100ms để không ảnh hưởng đến trải nghiệm streaming.

## 3. Danh sách Tác vụ (Technical Tasks)
- **T6.1:** Xây dựng `MonitorService` để thực hiện kiểm tra song song (Parallel Check) trên dòng text đang stream.
- **T6.2:** Triển khai thuật toán tích lũy cảm xúc (Sentiment Accumulation) dựa trên Output của Stage 1 và Stage 3.
- **T6.3:** Xây dựng cơ chế `Intervention Prompt`: Tự động chèn câu nói xoa dịu nếu AI phát hiện người dùng đang trong trạng thái cực kỳ tiêu cực.
- **T6.4:** Lưu trữ `Raw_Logs` vào Redis. **Lưu ý:** Bỏ qua việc lưu log nếu Session có flag `is_incognito: true`.
- **T6.5:** Triển khai `Roleplay_Guard` để từ chối các yêu cầu bẻ lái AI sang các vai diễn không phù hợp.
- **T6.6:** Xây dựng hệ thống cảnh báo (Alerting) về Admin Dashboard khi phát hiện Crisis mức độ cao.
- **T6.7:** Viết Unit Test cho bộ lọc Safety Shield với các mẫu test case nhạy cảm.

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Bộ lọc Safety quá khắt khe làm mất đi tính thấu cảm tự nhiên của AI.
- **Giảm thiểu:** Sử dụng AI-based safety check (nhẹ) phối hợp với Heuristic để phân biệt giữa "tâm sự buồn" và "nội dung độc hại".

## 5. Phụ thuộc (Dependencies)
- **Epic:** [EPIC-04] (Simulation output).
- **Tài liệu:** [TechnicalArchitecture.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/TechnicalArchitecture.md) (Phần 2.3 & 3.0).
