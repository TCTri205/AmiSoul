# [EPIC-02] Perception & Intelligent Routing (Stage 1)

## 1. Mô tả
Triển khai lớp Nhận thức (Perception Layer) để phân tích ý định, cảm xúc và điều hướng yêu cầu của người dùng. Đây là "mắt xích" đầu tiên trong pipeline xử lý ngôn ngữ, giúp tối ưu hóa chi phí bằng cách phân loại độ phức tạp và đảm bảo an toàn tối đa thông qua nhận diện khủng hoảng.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] Tích hợp Google Generative AI SDK (Gemini 1.5 Flash) thành công.
- [ ] Stage 1 trả về Structured JSON: `{intent, sentiment, complexity, urgency, identity_match}`.
- [ ] **Confidence-Based Routing:** Phân loại tin nhắn vào 3 nhánh: Fast Path (Heuristic), Semi Path (SLM), Full Path (LLM).
- [ ] **Crisis Detection:** Nhận diện 100% các từ khóa khủng hoảng và kích hoạt Safety Override ngay lập tức.
- [ ] **Identity Anomaly:** So sánh văn phong tin nhắn hiện tại với `Behavioral_Signature` của người dùng trong Redis.
- [ ] **Summarization:** Tự động tóm tắt các khối tin nhắn > 800 tokens để tiết kiệm context cho Stage 3.

## 3. Danh sách Tác vụ (Technical Tasks)
- **T2.1:** Xây dựng `PerceptionService` tích hợp Gemini API với cơ chế Retry & Circuit Breaker.
- **T2.2:** Thiết kế Router Prompt để lấy Metadata và nhận diện intent đặc biệt (e.g., `forget_me`, `delete_memory`).
- **T2.3:** Triển khai `IdentityService` để tính toán độ lệch chuẩn văn phong (Style matching logic).
- **T2.4:** Xây dựng bộ lọc Heuristic cho Crisis: Tích hợp thông tin Hotlines (Ngày Mai: 091.223.3300, Tổng đài 111).
- **T2.5:** Triển khai cơ chế `Prompt Injection Detection` cơ bản tại lớp Router.
- **T2.6:** Xây dựng Middleware để chuyển đổi Output của Stage 1 thành Input chuẩn cho Stage 2 & 3.
- **T2.7:** Viết Integration Test kiểm tra độ chính xác của phân loại Intent (Target: > 85%).

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** API Gemini bị chậm hoặc rate limit làm nghẽn pipeline.
- **Giảm thiểu:** Sử dụng Cache kết quả Perception cho các tin nhắn lặp lại và thiết lập fallback sang mô hình nhỏ hơn (Local SLM).

## 5. Phụ thuộc (Dependencies)
- **Epic:** [EPIC-01] (Để nhận Message Block).
- **Tài liệu:** [TechnicalArchitecture.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/TechnicalArchitecture.md) (Phần 2.2).
