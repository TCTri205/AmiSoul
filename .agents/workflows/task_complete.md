# Title: /task-complete
# Description: Hoàn tất task, chạy kiểm tra và push code

Quy trình chuẩn để kết thúc một nhiệm vụ:

1. **Verify:** Chạy `testing-qa` để đảm bảo toàn bộ mã nguồn mới không gây lỗi (Unit & Integration tests).
2. **Lint:** Chạy linting/formatting để đảm bảo tuân thủ `tech_standards.md`.
3. **Commit:** Sử dụng `github` skill để tạo commit với chuẩn Conventional Commits.
4. **Push:** Đẩy code lên repository.
5. **Sync:** Kích hoạt `sync_ticket_status` để cập nhật Dashboard `Tickets_Status.md`.
6. **Report:** Tóm tắt các thay đổi và thông báo cho người dùng.
