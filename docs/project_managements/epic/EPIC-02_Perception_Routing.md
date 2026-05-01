# [EPIC-02] Perception & Intelligent Routing (Stage 1)

## 1. Mô tả
Xây dựng khả năng "nhìn" và "hiểu" của AI đối với input thô từ người dùng. EPIC này tập trung vào Stage 1 của Pipeline, sử dụng các mô hình ngôn ngữ nhỏ (SLM) để phân tích ý định, cảm xúc và điều hướng luồng xử lý tối ưu, giúp giảm thiểu độ trễ và chi phí.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [x] **Perception Service:** Tích hợp thành công Gemini API để phân tích Text Block từ Stage 0.
- [x] **Intelligent Routing:** Phân loại được 3 nhánh xử lý: Fast Path (Heuristic), Semi-Cognitive, và Full Cognitive Path.
- [x] **Intent & Sentiment:** Trích xuất chính xác `intent`, `sentiment`, `complexity` và `urgency` (Crisis signals).
- [x] **Identity Match:** So sánh văn phong tin nhắn hiện tại với `Behavioral_Signature` lưu trong Redis.
- [x] **Late Night Recognition:** Nhận diện được các tin nhắn gửi trong khung giờ 23h-5h sáng để điều chỉnh Vibe.

## 3. Danh sách Tác vụ (Technical Tasks)
- **[T2.1: Perception Service Gemini](../ticket/Sprint-02/T2.1_Perception_Service_Gemini.md)**
- **[T2.2: Thiết kế Router Prompt](../ticket/Sprint-02/T2.2_Router_Prompt_Design.md)**
- **[T2.3: Identity Service Style](../ticket/Sprint-02/T2.3_Identity_Service_Style.md)**
- **[T2.4: Crisis Heuristic Filter](../ticket/Sprint-02/T2.4_Crisis_Heuristic_Filter.md)**
- **[T2.5: Prompt Injection Detection](../ticket/Sprint-02/T2.5_Prompt_Injection_Detection.md)**
- **[T2.6: Stage Middleware Input](../ticket/Sprint-02/T2.6_Stage_Middleware_Input.md)**
- **[T2.7: Integration Test Intent](../ticket/Sprint-02/T2.7_Integration_Test_Intent.md)**

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Model phân loại sai Intent dẫn đến AI phản hồi lạc quẻ.
- **Giảm thiểu:** Triển khai **Confidence-Based Routing** (Nếu độ tin cậy < 0.85 thì tự động chuyển sang Full Cognitive Path).

## 5. Phụ thuộc (Dependencies)
- **Tài liệu:** [TechnicalArchitecture.md](../../architecture/TechnicalArchitecture.md) (Phần 2.2).
- **Hệ thống:** Stage 0 (Aggregator) hoàn thiện.
