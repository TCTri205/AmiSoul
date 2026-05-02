# AI Agent Orchestration

Hướng dẫn AI cách lựa chọn và phối hợp các bộ kỹ năng (Skills) và quy trình (Workflows).

## 🧭 Nguyên tắc Lựa chọn
- **Ưu tiên Workflows:** Luôn kiểm tra xem có Workflow (`/slash-command`) nào phù hợp với yêu cầu của người dùng trước khi tự thực hiện các bước lẻ.
- **Progressive Disclosure:** Chỉ kích hoạt các Skill chuyên sâu (Vd: `nodejs-backend-patterns`) khi bắt đầu giai đoạn thực thi code.
- **Reasoning First:** Sử dụng `logic-lens` cho giai đoạn phân tích và lập kế hoạch trước khi viết dòng code đầu tiên.

## 🔗 Phối hợp Kỹ năng
- **Planning:** `logic-lens` -> `implementation_plan.md`.
- **Development:** `nodejs-backend-patterns` + `tech_standards.md`.
- **Verification:** `testing-qa` -> Chạy test và sửa lỗi.
- **Cleanup:** `sync_ticket_status` -> Cập nhật Dashboard.

## ⚠️ Giới hạn
- Nếu yêu cầu của người dùng mơ hồ, không được đoán. Phải sử dụng `logic-lens` để liệt kê các điểm chưa rõ và hỏi lại người dùng.
