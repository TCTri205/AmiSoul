# [EPIC-04] Unified Cognitive Simulation (Stage 3)

## 1. Mô tả
Triển khai "trái tim" của hệ thống - Simulation Service (Stage 3). EPIC này tập trung vào việc tạo ra các phản hồi thấu cảm, tự nhiên và mang đậm bản sắc cá nhân của Ami thông qua kỹ thuật Prompt Engineering nâng cao và mô hình Gemini 1.5 Flash.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] **Single-Pass Generation:** Tạo phản hồi bao gồm cả nội dung text và các metadata hành động/emoji trong một lượt gọi duy nhất.
- [ ] **Theory of Mind (ToM):** AI có khả năng suy luận về trạng thái tinh thần và mong muốn của người dùng.
- [ ] **XML System Prompt:** Sử dụng cấu trúc thẻ XML để phân tách rạch ròi các lớp quy tắc, ký ức và input của người dùng.
- [ ] **Token Budget Management:** Tự động cắt tỉa context để luôn nằm trong giới hạn 3000 tokens.
- [ ] **Boundary Isolation:** Ngăn chặn tuyệt đối việc người dùng ép AI phá vỡ nhân vật thông qua Prompt Injection.

## 3. Danh sách Tác vụ (Technical Tasks)
- **[T4.1: Simulation Service Gemini](../ticket/Sprint-04/T4.1_Simulation_Service_Gemini.md)**
- **[T4.2: XML System Prompt Design](../ticket/Sprint-04/T4.2_XML_System_Prompt.md)**
- **[T4.3: Token Budget Manager](../ticket/Sprint-04/T4.3_Token_Budget_Manager.md)**
- **[T4.4: Prompt Boundary Isolation](../ticket/Sprint-04/T4.4_Prompt_Boundary_Isolation.md)**
- **[T4.5: Self-Correction Safety](../ticket/Sprint-04/T4.5_Self_Correction_Safety.md)**
- **[T4.6: Reaction Generator](../ticket/Sprint-04/T4.6_Reaction_Generator_Emoji.md)**
- **[T4.7: Simulation Abort Test](../ticket/Sprint-04/T4.7_Simulation_Abort_Test.md)**

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** AI phản hồi quá dài hoặc lặp lại (vi phạm Grice's Maxims).
- **Giảm thiểu:** Tích hợp bộ quy tắc Grice vào System Prompt và triển khai Monitor (Stage 4) để phát hiện lặp từ.

## 5. Phụ thuộc (Dependencies)
- **Service:** Stage 1 (Router) và Stage 2 (Retriever) hoàn thiện.
- **Tài liệu:** [TechnicalArchitecture.md](../../architecture/TechnicalArchitecture.md) (Phần 2.3).
