# Title: /check-progress
# Description: Kiểm tra tiến độ dự án và đồng bộ Dashboard

Quy trình kiểm tra nhanh trạng thái công việc:

1. **Đồng bộ:** Kích hoạt skill `sync_ticket_status` để quét toàn bộ các ticket trong `docs/project_managements/ticket/`.
2. **Phân tích Dashboard:** Đọc file `Tickets_Status.md` để xác định các ticket đang `In Progress` hoặc `Ready`.
3. **Kiểm tra Git:** So sánh trạng thái ticket với các commit gần nhất trên Git để đảm bảo tính nhất quán.
4. **Báo cáo:** Hiển thị bảng tóm tắt tiến độ hiện tại và các task ưu tiên cần xử lý tiếp theo.
