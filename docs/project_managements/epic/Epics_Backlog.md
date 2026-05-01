# Danh sách Epic & Lộ trình Sprint - AmiSoul

Tài liệu này phân rã các mốc quan trọng từ `ProjectPlan.md` thành các Epic chi tiết, được ánh xạ vào các Sprint thực tế để triển khai **AmiSoul Cognitive Engine (ACE v2.1)**.

---

## 1. Tổng quan Lộ trình (Roadmap Overview)

Dự án được chia thành **9 Sprint** (Dự kiến 1 tuần/sprint cho MVP nhanh hoặc 2 tuần/sprint cho độ ổn định cao).

| Sprint | Epic ID | Tên Sprint | Mục tiêu Trọng tâm |
| :--- | :--- | :--- | :--- |
| **[S1](../ticket/Sprint-01/)** | **EPIC-01** | Foundation & Real-time Gateway | Setup hạ tầng NestJS, Redis, PostgreSQL & Stage 0. |
| **[S2](../ticket/Sprint-02/)** | **EPIC-02** | Perception & Routing | Triển khai Stage 1 (SLM Router) & Logic phân loại Intent/Sentiment. |
| **[S3](../ticket/Sprint-03/)** | **EPIC-03** | Affective Memory & Security | Triển khai Stage 2, PGVector & Prisma Encryption Middleware. |
| **[S4](../ticket/Sprint-04/)** | **EPIC-04** | The Brain (Simulation) | Hoàn thiện Stage 3 (Gemini Flash Single-pass). |
| **[S5](../ticket/Sprint-05/)** | **EPIC-05** | Safe Harbor Frontend | UI Web, Socket.io Streaming & Giao diện cảm xúc. |
| **[S6](../ticket/Sprint-06/)** | **EPIC-06** | Safety & Monitoring | Stage 4 (Safety Shield, Vibe Monitor). |
| **[S7](../ticket/Sprint-07/)** | **EPIC-07** | Offline Intelligence | Stage 5 (BullMQ), Memory Compression & Implicit Feedback. |
| **[S8](../ticket/Sprint-08/)** | **EPIC-08** | Relationship Evolution | Bonding Score & DPE Persona Evolution logic. |
| **[S9](../ticket/Sprint-09/)** | **EPIC-09** | Launch Readiness | Load test, Latency Tuning & Production Setup. |

---

## 2. Chi tiết các Epic

### [[EPIC-01] Foundation & Real-time Aggregator (Stage 0)](EPIC-01_Foundation_Aggregator.md)
*   **Mô tả:** Thiết lập "xương sống" kỹ thuật cho toàn bộ hệ thống.
*   **User Stories Key:**
    *   Là hệ thống, tôi muốn gom các tin nhắn ngắn của người dùng thành một khối (Debounce) để AI không bị quá tải.
    *   Là hệ thống, tôi muốn có khả năng ngắt dòng (Preemption) khi người dùng nhắn tin mới trong lúc AI đang xử lý.
*   **Kết quả:** Backend NestJS chạy với Docker, kết nối Redis/Postgres thành công, Stage 0 hoạt động ổn định qua Socket.io.
*   **Chi tiết Ticket:** [Sprint-01 Tickets](../ticket/Sprint-01/)

### [[EPIC-02] Perception & Intelligent Routing (Stage 1)](EPIC-02_Perception_Routing.md)
*   **Mô tả:** Xây dựng khả năng "nhìn" và "hiểu" của AI đối với input thô.
*   **User Stories Key:**
    *   Là AI, tôi muốn phân loại độ phức tạp của tin nhắn để chọn nhánh xử lý (Fast/Full Path) tối ưu chi phí.
    *   Là AI, tôi muốn nhận diện các tín hiệu khủng hoảng (Crisis) ngay lập tức để bảo vệ người dùng.
*   **Kết quả:** Service Stage 1 tích hợp SLM (vLLM/API), trả về Metadata (Intent, Sentiment, Complexity) chính xác.
*   **Chi tiết Ticket:** [Sprint-02 Tickets](../ticket/Sprint-02/)

### [[EPIC-03] Affective Memory & Security (Stage 2)](EPIC-03_Memory_CAL.md)
*   **Mô tả:** Xây dựng hệ thống lưu trữ ký ức và bảo mật dữ liệu ngay từ đầu.
*   **User Stories Key:**
    *   Là người dùng, tôi muốn AI nhớ những chuyện quan trọng tôi đã kể (CMA).
    *   Là người dùng, tôi muốn biết dữ liệu nhạy cảm của mình được mã hóa an toàn trong cơ sở dữ liệu.
*   **Kết quả:** Tích hợp PGVector, hoàn thiện Prisma Encryption Middleware, bảo mật dữ liệu CMA/CAL.
*   **Chi tiết Ticket:** [Sprint-03 Tickets](../ticket/Sprint-03/)

### [[EPIC-04] Unified Cognitive Simulation (Stage 3)](EPIC-04_Simulation_The_Brain.md)
*   **Mô tả:** Triển khai "trái tim" của sự thấu cảm - Single-pass Simulation.
*   **User Stories Key:**
    *   Là người dùng, tôi muốn nhận được phản hồi thấu cảm, tự nhiên và không rập khuôn.
*   **Kết quả:** Tích hợp Gemini Flash SDK, hoàn thiện bộ System Prompt (ToM, Grice), phản hồi streaming mượt mà.
*   **Chi tiết Ticket:** [Sprint-04 Tickets](../ticket/Sprint-04/)

### [[EPIC-05] Safe Harbor Frontend & Real-time Integration](EPIC-05_Safe_Harbor_Frontend.md)
*   **Mô tả:** Xây dựng giao diện người dùng tối giản và ấm áp.
*   **User Stories Key:**
    *   Là người dùng, tôi muốn một không gian nhắn tin yên tĩnh, mang lại cảm giác an toàn.
*   **Kết quả:** Web App hoàn chỉnh (React/Next.js), kết nối realtime qua Socket.io, hiển thị được các trạng thái "Đang gõ...", "Đang suy nghĩ...".
*   **Chi tiết Ticket:** [Sprint-05 Tickets](../ticket/Sprint-05/)

### [[EPIC-06] Empathy Safety & Vibe Monitoring (Stage 4)](EPIC-06_Safety_Vibe_Monitor.md)
*   **Mô tả:** Giám sát chất lượng và an toàn của phản hồi AI trước khi đến tay người dùng.
*   **User Stories Key:**
    *   Là hệ thống, tôi muốn ngăn chặn AI bị thao túng hoặc phá vỡ nhân vật (Prompt Injection).
*   **Kết quả:** Stage 4 Monitor hoạt động, cập nhật Session Vibe vào Redis sau mỗi lượt chat.
*   **Chi tiết Ticket:** [Sprint-06 Tickets](../ticket/Sprint-06/)

### [[EPIC-07] Offline Intelligence & Memory Management (Stage 5)](EPIC-07_Offline_Intelligence.md)
*   **Mô tả:** Xử lý các tác vụ nặng và tổng hợp phản hồi người dùng sau phiên.
*   **User Stories Key:**
    *   Là hệ thống, tôi muốn nén các đoạn chat dài thành các mẩu ký ức gọn nhẹ.
    *   Là hệ thống, tôi muốn học từ các tín hiệu phản hồi ngầm (Implicit Feedback) để cải thiện AI.
*   **Kết quả:** BullMQ Workers hoạt động ngầm, thực hiện nén ký ức và xử lý vòng lặp phản hồi.
*   **Chi tiết Ticket:** [Sprint-07 Tickets](../ticket/Sprint-07/)

### [[EPIC-08] Bonding Evolution & Persona Growth](EPIC-08_Bonding_Persona.md)
*   **Mô tả:** Triển khai logic tiến hóa mối quan hệ giữa Người dùng và AI.
*   **User Stories Key:**
    *   Là người dùng, tôi muốn thấy mối quan hệ với AmiSoul ngày càng thân thiết và sâu sắc hơn theo thời gian.
*   **Kết quả:** Logic Bonding Score hoạt động, DPE Persona tự động cập nhật dựa trên lịch sử tương tác.
*   **Chi tiết Ticket:** [Sprint-08 Tickets](../ticket/Sprint-08/)

### [[EPIC-09] Launch Readiness & Production Setup](EPIC-09_Launch_Readiness.md)
*   **Mô tả:** Đảm bảo hệ thống đạt tiêu chuẩn sản xuất (Production-ready). Đạt mục tiêu Latency E2E < 6s, pass 1000 CCU load test, và vận hành ổn định trên Cloud.
*   **Chi tiết Ticket:** [Sprint-09 Tickets](../ticket/Sprint-09/)
