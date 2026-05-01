# Kế hoạch Dự án - AmiSoul

**Dự án:** AmiSoul - Người Bạn Đồng Hành AI Thấu Cảm
**Phiên bản:** v3.0.0
**Trạng thái:** Lộ trình Phát triển Chi tiết (ACE v2.1)
**Cập nhật lần cuối:** 2026-04-30

---

## 1. Chiến lược Dự án: Hiện thực hóa ACE v2.1
Mục tiêu là xây dựng hệ thống **AmiSoul Cognitive Engine (ACE)** hoàn chỉnh, tối ưu hóa cho trải nghiệm nhắn tin thời gian thực, thấu cảm sâu sắc và độ trễ thấp.

### 1.1. Phạm vi Thực hiện (MVP Phase)
*   **Pipeline 5 Giai đoạn:** Triển khai trọn vẹn luồng xử lý từ Stage 0 (Aggregator) đến Stage 5 (Offline Consolidation).
*   **Hybrid Memory:** Hệ thống bộ nhớ kết hợp Redis (L1) và PostgreSQL/pgvector (L2) cho CMA và CAL.
*   **Bonding & Vibe:** Cơ chế tiến hóa mối quan hệ và cảm xúc tức thời.
*   **An toàn Thấu cảm:** Giám sát khủng hoảng thời gian thực và tích hợp hotline hỗ trợ tại Việt Nam.
*   **Giao diện "Safe Harbor":** Web App tối giản, tập trung vào kết nối cảm xúc.

### 1.2. Ngoài Phạm vi (Post-MVP)
*   **Voice & Media:** Tương tác giọng nói thời gian thực và xử lý ảnh/video chuyên sâu.
*   **Proactive Messaging:** AI chủ động nhắn tin dựa trên sự kiện CAL (đã thiết kế nhưng sẽ triển khai sau).
*   **Native Apps:** Ứng dụng iOS/Android chính thức.

---

## 2. Mục tiêu & Các mốc quan trọng (Milestones)

| Cột mốc | Mục tiêu | Sản phẩm bàn giao chính | Thời gian |
| :--- | :--- | :--- | :--- |
| **M1: Nền tảng** | Hạ tầng & Stage 0 | NestJS, Docker, Redis, PostgreSQL setup. Hoàn thiện Stage 0 (Debounce & Aggregator). | Tuần 1-2 |
| **M2: Não bộ** | Pipeline Stage 1-3 & Security | Tích hợp vLLM (Router), pgvector (CMA/CAL) và Prisma Encryption Middleware. | Tuần 3-4 |
| **M3: Tương tác** | Frontend & Stage 4 | UI Safe Harbor, Socket.io Streaming, Giao diện cảm xúc & Safety Monitor. | Tuần 5-6 |
| **M4: Củng cố** | Stage 5 & Feedback | BullMQ Workers, Memory Compression, Implicit Feedback Loop. | Tuần 7-8 |
| **M5: Tối ưu** | QA & Deployment | Load test (1000 CCU), Tinh chỉnh Latency SLO (E2E < 6s), Triển khai Production. | Tuần 9 |

---

## 3. Quản lý Tài nguyên & Chi phí
### 3.1. Tài nguyên Kỹ thuật
- **Backend:** Node.js/NestJS (Orchestration).
- **AI Hosting:** vLLM/Ollama cho SLM (Stage 1); Google AI SDK cho Gemini Flash (Stage 3).
- **Infrastructure:** Docker Compose cho giai đoạn đầu, tiến tới K8s nếu cần mở rộng.

### 3.2. Tối ưu Chi phí (Cost Management)
- Sử dụng **Single-pass Prompt** tại Stage 3 để giảm số lượng API calls.
- Ưu tiên **SLM tự host** cho các tác vụ phân tích đơn giản tại Stage 1.
- Dùng **Redis Cache** để giảm tải truy vấn cho PostgreSQL.

---

## 4. Mục tiêu Chất lượng (SLO)
*   **Độ trễ (Latency):** 95% tin nhắn văn bản phản hồi < 3s (Backend) và < 6s (E2E).
*   **Độ chính xác Memory:** Truy xuất đúng ký ức liên quan (Affective Retrieval) với độ chính xác > 85% trong kiểm thử.
*   **Tính ổn định:** Uptime hệ thống > 99.5%.
*   **An toàn:** 100% các tín hiệu khủng hoảng được nhận diện và xử lý theo Crisis Protocol.

---

## 5. Quản lý Rủi ro
| Rủi ro | Tác động | Chiến lược Giảm thiểu |
| :--- | :--- | :--- |
| **Độ trễ LLM Cloud tăng cao** | Cao | Sử dụng Gemini Flash (tốc độ cao) và có phương án Fallback sang SLM nội bộ. |
| **Chi phí API vượt ngân sách** | Trung bình | Áp dụng Daily Token Budget cho mỗi user và tối ưu Prompt. |
| **Xung đột bộ nhớ (CMA)** | Thấp | Sử dụng thuật toán HNSW cho pgvector và quy tắc Memory Conflict Resolution. |
| **Ảo giác AI (Hallucination)** | Trung bình | Sử dụng RAG (CMA) mạnh mẽ và Prompt Constraints (ToM/Grice). |

---

## 6. Giao thức Phát triển
*   **Trạng thái Tài liệu:** Toàn bộ đặc tả kỹ thuật phải được cập nhật tại `/docs/architecture`.
*   **Kiểm thử:** Unit test cho các Stage logic; Integration test cho toàn bộ Pipeline.
*   **CI/CD:** Tự động hóa kiểm tra mã nguồn và triển khai môi trường Staging.

---

## 7. Lộ trình Triển khai Chi tiết
Chi tiết các Epic và danh sách Ticket cho từng Sprint có thể được theo dõi tại:
*   **[Epics Backlog & Sprint Roadmap](file:///d:/Persional_Projects/AmiSoul/docs/project_managements/epic/Epics_Backlog.md)**
*   **[Sprint Tickets](file:///d:/Persional_Projects/AmiSoul/docs/project_managements/ticket/)**
