# [EPIC-04] Unified Cognitive Simulation (Stage 3)

## 1. Mô tả
Triển khai "Trái tim" của AmiSoul - lớp giả lập hội thoại hợp nhất (Cognitive Simulation). Sử dụng mô hình Gemini 1.5 Flash để sinh phản hồi thấu cảm trong một lần chạy duy nhất (Single-pass), kết hợp toàn bộ tri thức từ các giai đoạn trước để tạo ra sự tương tác tự nhiên và có chiều sâu.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] Triển khai `Single-Pass Generation` thành công, không phát sinh thêm các bước sinh nháp (Drafting) để giảm Latency.
- [ ] **System Prompt:** Tích hợp các ràng buộc hội thoại nâng cao: `Theory of Mind` (Thấu hiểu tâm trí), `Grice's Maxims` (Nguyên tắc hội thoại hợp tác).
- [ ] **Dynamic Token Allocation:** Phân bổ linh hoạt Budget 3000 tokens cho: Persona (500), Vibe (200), Memory (800), History (1000), User Input (500).
- [ ] **Streaming Response:** Phản hồi được stream trực tiếp từ LLM về Socket.io với chunk size tối ưu (từ 5-10 tokens).
- [ ] **Persona Consistency:** AI giữ đúng bản sắc Ami (Ấm áp, thấu cảm, không phán xét) trong 95% tình huống test.

## 3. Danh sách Tác vụ (Technical Tasks)
- **T4.1:** Xây dựng `SimulationService` tích hợp Gemini 1.5 Flash SDK với cấu hình `response_mime_type: "text/plain"`.
- **T4.2:** Thiết kế System Prompt hợp nhất sử dụng XML Tags để phân tách các thành phần ngữ cảnh (`<identity>`, `<context>`, `<vibe>`).
- **T4.3:** Triển khai module `TokenBudgetManager` để tự động cắt tỉa (Pruning) context khi vượt quá giới hạn 3000 tokens.
- **T4.4:** Xây dựng cơ chế `Prompt Boundary Isolation` (Dùng dấu phân cách đặc biệt) để ngăn chặn Prompt Injection rò rỉ vào phản hồi.
- **T4.5:** Triển khai `Self-Correction` logic: Nếu Gemini trả về nội dung vi phạm Safety, tự động sinh phản hồi mặc định mang tính xoa dịu.
- **T4.6:** Tích hợp `Reaction_Generator`: Tự động sinh emoji hoặc hành động ngắn kèm theo văn bản (ví dụ: *mỉm cười nhẹ*).
- **T4.7:** Viết Unit Test cho việc xử lý AbortSignal (Dừng sinh text khi có Preemption từ Stage 0).

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** LLM sinh phản hồi quá dài làm tăng latency và chi phí.
- **Giảm thiểu:** Thiết lập `max_output_tokens` linh hoạt dựa trên `complexity` từ Stage 1.

## 5. Phụ thuộc (Dependencies)
- **Epic:** [EPIC-01], [EPIC-02], [EPIC-03].
- **Tài liệu:** [TechnicalArchitecture.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/TechnicalArchitecture.md) (Phần 2.3).
