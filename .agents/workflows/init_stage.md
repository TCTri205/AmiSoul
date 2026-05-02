# Title: /init-stage
# Description: Khởi tạo một Stage mới trong kiến trúc ACE v2.1

Quy trình tự động hóa việc tạo boilerplate cho một Stage mới:

1. **Phân tích:** Xác định tên Stage và các tính năng chính cần triển khai.
2. **Kích hoạt Skill:** Sử dụng skill `ace_stage_generator` để tạo cấu trúc Module, Service và DTO.
3. **Cập nhật Schema:** Kiểm tra xem Stage này có cần lưu trữ dữ liệu mới vào Prisma không. Nếu có, đề xuất thay đổi schema.
4. **Đăng ký Module:** Tự động import Module mới vào `AppModule`.
5. **Cập nhật GEMINI.md:** Cập nhật trạng thái của Stage trong tài liệu Source of Truth.
6. **Báo cáo:** Tóm tắt các file đã tạo và các bước tiếp theo cần thực hiện.
