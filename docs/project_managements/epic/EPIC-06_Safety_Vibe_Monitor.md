# [EPIC-06] Empathy Safety & Vibe Monitoring (Stage 4)

## 1. Mô tả
Giám sát chất lượng và an toàn của phản hồi AI trước khi đến tay người dùng. EPIC này triển khai lớp phòng thủ cuối cùng (Monitor) để đảm bảo Ami luôn giữ đúng nhân vật, không vi phạm các quy tắc an toàn và cập nhật trạng thái cảm xúc phiên chat liên tục.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [x] **Safety Shield:** Kiểm tra nội dung độc hại, nhạy cảm hoặc vi phạm chính sách của Google Gemini.
- [x] **Roleplay Guard:** Từ chối các yêu cầu bẻ lái nhân vật dựa trên mức độ thân thiết (Bonding Level).
- [x] **Crisis Protocol:** Tự động chèn thông tin hỗ trợ/hotline nếu phát hiện người dùng có ý định tự hại.
- [x] **Sentiment Accumulation:** Tính toán xu hướng cảm xúc của phiên chat để cập nhật `Session_Vibe`.
- [x] **Parallel Check:** Thực hiện giám sát song song với streaming để không gây trễ cho người dùng.

## 3. Danh sách Tác vụ (Technical Tasks)
- **[T6.1: Monitor Service Parallel](../ticket/Sprint-06/T6.1_Monitor_Service_Parallel.md)**
- **[T6.2: Sentiment Accumulation](../ticket/Sprint-06/T6.2_Sentiment_Accumulation_Algo.md)**
- **[T6.3: Intervention Prompt Logic](../ticket/Sprint-06/T6.3_Intervention_Prompt_Logic.md)**
- **[T6.4: Raw Log Redis Buffering](../ticket/Sprint-06/T6.4_Raw_Log_Redis_Buffering.md)**
- **[T6.5: Roleplay Guard Protection](../ticket/Sprint-06/T6.5_Roleplay_Guard_Protection.md)**
- **[T6.6: Crisis Alerting System](../ticket/Sprint-06/T6.6_Crisis_Alerting_System.md)**
- **[T6.7: Safety Shield Unit Test](../ticket/Sprint-06/T6.7_Safety_Shield_Unit_Test.md)**

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Monitor ngắt tin nhắn nhầm (False Positive).
- **Giảm thiểu:** Triển khai cơ chế **Self-Correction** (Stage 3) để AI tự sửa trước khi Monitor phải can thiệp cứng.

## 5. Phụ thuộc (Dependencies)
- **Service:** Simulation Service (Stage 3) hoàn thiện.
- **Tài liệu:** [TechnicalArchitecture.md](../../architecture/TechnicalArchitecture.md) (Phần 2.3).
