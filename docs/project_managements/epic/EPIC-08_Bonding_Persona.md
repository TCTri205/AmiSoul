# [EPIC-08] Bonding Evolution & Persona Growth

## 1. Mô tả
Triển khai logic cốt lõi để phát triển mối quan hệ giữa Người dùng và AmiSoul. Epic này hiện thực hóa khả năng "tiến hóa" của AI, biến Ami từ một trợ lý xa lạ thành một người bạn tri kỷ thông qua hệ thống tính điểm thân thiết (Bonding Score) và điều chỉnh nhân cách động (Dynamic Persona Evaluation - DPE).

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] **Bonding_Delta Calculation:** Tính toán chính xác sự thay đổi điểm thân thiết sau mỗi session dựa trên 4 trọng số: Sentiment (`w1`), Frequency (`w2`), Duration (`w3`), và Implicit Feedback (`w4`).
- [ ] **Bonding_Score Persistence:** Điểm thân thiết được lưu trữ bền vững trong PostgreSQL và cache lại vào Redis khi bắt đầu session mới.
- [ ] **Persona Evolution (DPE):** AI tự động thay đổi phong cách xưng hô (ví dụ: từ "Tôi - Bạn" sang "Ami - [Tên User]") và độ sâu của sự chia sẻ dựa trên 5 cấp độ gắn kết.
- [ ] **Silence Penalty:** Logic tự động giảm điểm thân thiết nếu người dùng không tương tác trong một khoảng thời gian dài (quy định theo cấu hình).
- [ ] **Behavioral Baseline:** Cập nhật thành công thói quen nhắn tin của người dùng (giờ giấc, chủ đề yêu thích, tốc độ phản hồi) để phát hiện sự bất thường.

## 3. Danh sách Tác vụ (Technical Tasks)
- **T8.1:** Triển khai `BondingService` thực hiện công thức toán học tính `Bonding_Delta` tại Stage 5.
- **T8.2:** Xây dựng `PersonaManager` để ánh xạ `Bonding_Score` sang các biến môi trường trong System Prompt (DPE).
- **T8.3:** Triển khai logic `Implicit Feedback Loop`: Phân tích tốc độ reply của user và hành động xóa tin nhắn để tinh chỉnh điểm bonding.
- **T8.4:** Xây dựng Scheduler thực hiện `Decay_Job` hàng tuần để áp dụng Silence Penalty.
- **T8.5:** Tích hợp tính năng `Special_Date_Recognition`: AI chủ động nhắc lại hoặc chúc mừng các sự kiện quan trọng trong ký ức.
- **T8.6:** Xây dựng Dashboard nội bộ (dành cho DEV) để theo dõi biểu đồ tăng trưởng Bonding của người dùng.
- **T8.7:** Viết Integration Test cho luồng cập nhật Bonding Score từ Stage 5 về DB.

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Điểm bonding tăng quá nhanh hoặc quá chậm làm mất đi tính thực tế.
- **Giảm thiểu:** Thiết lập ngưỡng `Daily_Cap` (Giới hạn tăng điểm tối đa mỗi ngày) để đảm bảo mối quan hệ phát triển tự nhiên.

## 5. Phụ thuộc (Dependencies)
- **Epic:** [EPIC-07] (Consolidation Worker).
- **Tài liệu:** [TechnicalArchitecture.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/TechnicalArchitecture.md) (Phần 4.0).
