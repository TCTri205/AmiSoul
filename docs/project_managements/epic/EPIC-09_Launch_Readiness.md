# [EPIC-09] Launch Readiness & Production Setup

## 1. Mô tả
Giai đoạn cuối cùng tập trung vào việc tối ưu hóa hiệu năng, bảo mật và chuẩn bị các thủ tục để đưa hệ thống lên môi trường sản xuất (Production-ready). Đảm bảo AmiSoul vận hành ổn định, an toàn và đạt được các chỉ số SLO đã cam kết trong kiến trúc.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] **Latency SLO:** Đạt mục tiêu thời gian phản hồi (Time to First Token) < 3s cho 95% yêu cầu thực tế.
- [ ] **Scalability:** Hệ thống vượt qua bài kiểm tra tải với 1000 người dùng kết nối đồng thời (CCU) mà không bị treo hoặc rò rỉ bộ nhớ.
- [ ] **Security At-rest:** Toàn bộ dữ liệu ký ức (CMA) và thông tin cá nhân được mã hóa bằng thuật toán AES-256-GCM trong PostgreSQL.
- [ ] **Observability:** Triển khai Dashboard giám sát thời gian thực hiển thị: Latency, Error Rate, Token Usage, và Bonding Stats.
- [ ] **Production Environment:** Hệ thống vận hành ổn định trên hạ tầng Cloud (Docker-based) với cơ chế Auto-scaling cơ bản.

## 3. Danh sách Tác vụ (Technical Tasks)
- **T9.1:** Thực hiện Load Test kịch bản hội thoại thực tế sử dụng `Artillery` hoặc `Locust`.
- **T9.2:** Tối ưu hóa Database: Indexing `user_id` và cấu hình HNSW cho các cột vector.
- **T9.3:** Triển khai lớp Middleware mã hóa/giải mã tự động cho Prisma (Field-level encryption).
- **T9.4:** Cấu hình `Winston` và `Morgan` để log tập trung (Centralized Logging) qua ELK Stack hoặc dịch vụ tương đương.
- **T9.5:** Thiết lập CI/CD pipeline (GitHub Actions) để tự động hóa việc Build, Test và Deploy Docker Image.
- **T9.6:** Thực hiện Security Audit nội bộ (Quét lỗ hổng dependency, kiểm tra SQL Injection, XSS).
- **T9.7:** Viết tài liệu hướng dẫn vận hành (Operation Manual) cho đội ngũ quản trị.
- **T9.8:** Cấu hình Backup & Recovery hàng ngày cho cơ sở dữ liệu PostgreSQL.

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Chi phí API AI tăng vọt khi số lượng người dùng tăng nhanh.
- **Giảm thiểu:** Triển khai cơ chế `Quota Management` (Giới hạn số lượt chat mỗi ngày cho mỗi user) và tối ưu Prompt để giảm token tiêu thụ.

## 5. Phụ thuộc (Dependencies)
- **Tất cả các Epics từ [EPIC-01] đến [EPIC-08].**
- **Tài liệu:** [SRS.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/SRS.md), [TechStack.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/TechStack.md).
