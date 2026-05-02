# [EPIC-09] Launch Readiness & Production Setup

## 1. Mô tả
Đảm bảo hệ thống đạt tiêu chuẩn sản xuất (Production-ready). EPIC này tập trung vào việc tối ưu hóa hiệu suất, bảo mật dữ liệu, thiết lập quy trình vận hành (Ops) và triển khai tự động (CI/CD) để sẵn sàng cho việc phát hành MVP.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] **Latency Optimization:** Đạt mục tiêu độ trễ E2E < 3.5s cho Fast Path và < 6s cho Full Path.
- [ ] **Load Testing:** Hệ thống chịu tải được 1000 người dùng đồng thời (CCU).
- [ ] **Data Security:** Toàn bộ tin nhắn và ký ức được mã hóa AES-256-GCM ở mức Database.
- [ ] **CI/CD Pipeline:** Tự động Build, Test và Deploy khi có code mới lên nhánh `master`.
- [ ] **Operation Manual:** Hoàn thiện tài liệu hướng dẫn vận hành, backup và recovery dữ liệu.

## 3. Danh sách Tác vụ (Technical Tasks)
- **[T9.1: Load Test Scenarios](../ticket/Sprint-09/T9.1_Load_Test_Scenarios.md)**
- **[T9.2: DB Indexing & Tuning](../ticket/Sprint-09/T9.2_DB_Indexing_HNSW_Tuning.md)**
- **[T9.3: Prometheus & Grafana Monitoring](../ticket/Sprint-09/T9.3_Prometheus_Grafana_Monitoring.md)**
- **[T9.4: Centralized Logging](../ticket/Sprint-09/T9.4_Centralized_Logging_Winston.md)**
- **[T9.5: GitHub Actions CI/CD](../ticket/Sprint-09/T9.5_Github_Actions_CICD.md)**
- **[T9.6: Internal Security Audit](../ticket/Sprint-09/T9.6_Internal_Security_Audit.md)**
- **[T9.7: Operation Manual](../ticket/Sprint-09/T9.7_Operation_Manual_Creation.md)**
- **[T9.8: Backup & Recovery](../ticket/Sprint-09/T9.8_Daily_Backup_Recovery.md)**

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Chi phí vận hành API (Gemini) vượt ngân sách khi có nhiều người dùng.
- **Giảm thiểu:** Thiết lập **Rate Limiting** (100 tin/giờ) và hạn ngạch chi phí (Cost Cap) trên Google Cloud Console.

## 5. Phụ thuộc (Dependencies)
- **Trạng thái:** Toàn bộ 8 Epic trước đó đã hoàn thành Integration.
