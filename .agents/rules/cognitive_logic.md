# AmiSoul Cognitive Logic Rules

Quy tắc dành riêng cho việc phát triển các tầng nhận thức (Cognitive Layers) của AmiSoul.

## 🧠 Tương tác với ACE Pipeline
- **Stage Isolation:** Mỗi Stage phải hoàn toàn độc lập về logic và chỉ giao tiếp qua các DTO/Interface đã định nghĩa.
- **Latency Guard:** Bất kỳ thay đổi nào làm tăng thời gian xử lý của Stage 0-4 > 500ms phải được báo cáo và tìm giải pháp tối ưu.
- **Memory Safety:** Khi làm việc với `CMA` (Memory), luôn đảm bảo dữ liệu nhạy cảm được mã hóa và không bao giờ log ra console.

## 🎭 Persona & Vibe
- **Consistency:** Mã nguồn xử lý hội thoại phải phản ánh đúng bản sắc của AmiSoul (Điềm đạm, Thấu cảm).
- **Vibe Tracking:** Luôn cập nhật hoặc tham chiếu đến `Session Vibe` trong Redis khi xử lý logic sinh phản hồi.

## 📅 Context Awareness (CAL)
- **Time Sensitivity:** Khi triển khai các task liên quan đến thời gian, phải luôn sử dụng `Current Time` từ hệ thống và đối chiếu với `CAL L1/L2`.
