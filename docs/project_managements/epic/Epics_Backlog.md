# Danh sách Epic & Lộ trình Sprint - AmiSoul

Tài liệu này phân rã các mốc quan trọng từ `ProjectPlan.md` thành các Epic chi tiết, được ánh xạ vào các Sprint thực tế để triển khai **AmiSoul Cognitive Engine (ACE v2.1)**.

---

## 1. Tổng quan Lộ trình (Roadmap Overview)

Dự án được chia thành **9 Sprint** (Dự kiến 1 tuần/sprint cho MVP nhanh hoặc 2 tuần/sprint cho độ ổn định cao).

| Sprint | Epic ID | Tên Sprint | Mục tiêu Trọng tâm |
| :--- | :--- | :--- | :--- |
| **S1** | **EPIC-01** | Foundation & Real-time Gateway | Setup hạ tầng NestJS, Redis, PostgreSQL & Stage 0. |
| **S2** | **EPIC-02** | Perception & Routing | Triển khai Stage 1 (SLM Router) & Logic phân loại Intent/Sentiment. |
| **S3** | **EPIC-03** | Affective Memory (CMA/CAL) | Triển khai Stage 2, PGVector RAG & Logic CAL (Sự kiện dở dang). |
| **S4** | **EPIC-04** | The Brain (Simulation) | Hoàn thiện Stage 3 (Gemini Flash Single-pass) & Prompt Engineering. |
| **S5** | **EPIC-05** | Safe Harbor Frontend | Xây dựng UI Web, tích hợp Socket.io Streaming & Giao diện cảm xúc. |
| **S6** | **EPIC-06** | Safety & Monitoring | Triển khai Stage 4 (Safety Shield, Vibe Monitor) & Crisis Protocol. |
| **S7** | **EPIC-07** | Offline Intelligence | Triển khai Stage 5 (BullMQ Workers) & Memory Compression. |
| **S8** | **EPIC-08** | Relationship Evolution | Hoàn thiện Bonding Score & DPE Persona Evolution logic. |
| **S9** | **EPIC-09** | Launch Readiness | Load test, tối ưu Latency, Fix bugs & Triển khai Production. |

---

## 2. Chi tiết các Epic

### [EPIC-01] Foundation & Real-time Aggregator (Stage 0)
*   **Mô tả:** Thiết lập "xương sống" kỹ thuật cho toàn bộ hệ thống.
*   **User Stories Key:**
    *   Là hệ thống, tôi muốn gom các tin nhắn ngắn của người dùng thành một khối (Debounce) để AI không bị quá tải.
    *   Là hệ thống, tôi muốn có khả năng ngắt dòng (Preemption) khi người dùng nhắn tin mới trong lúc AI đang xử lý.
*   **Kết quả:** Backend NestJS chạy với Docker, kết nối Redis/Postgres thành công, Stage 0 hoạt động ổn định qua Socket.io.

### [EPIC-02] Perception & Intelligent Routing (Stage 1)
*   **Mô tả:** Xây dựng khả năng "nhìn" và "hiểu" của AI đối với input thô.
*   **User Stories Key:**
    *   Là AI, tôi muốn phân loại độ phức tạp của tin nhắn để chọn nhánh xử lý (Fast/Full Path) tối ưu chi phí.
    *   Là AI, tôi muốn nhận diện các tín hiệu khủng hoảng (Crisis) ngay lập tức để bảo vệ người dùng.
*   **Kết quả:** Service Stage 1 tích hợp SLM (vLLM/API), trả về Metadata (Intent, Sentiment, Complexity) chính xác.

### [EPIC-03] Affective Memory & CAL System (Stage 2)
*   **Mô tả:** Xây dựng hệ thống lưu trữ và truy xuất ký ức theo cảm xúc.
*   **User Stories Key:**
    *   Là người dùng, tôi muốn AI nhớ những chuyện quan trọng tôi đã kể (CMA).
    *   Là người dùng, tôi muốn AI biết tôi đang chờ kết quả phỏng vấn hoặc có buổi thi (CAL).
*   **Kết quả:** Tích hợp PGVector, hoàn thiện thuật toán Affective Retrieval, Service Stage 2 trả về Context hợp nhất.

### [EPIC-04] Unified Cognitive Simulation (Stage 3)
*   **Mô tả:** Triển khai "trái tim" của sự thấu cảm - Single-pass Simulation.
*   **User Stories Key:**
    *   Là người dùng, tôi muốn nhận được phản hồi thấu cảm, tự nhiên và không rập khuôn.
*   **Kết quả:** Tích hợp Gemini Flash SDK, hoàn thiện bộ System Prompt (ToM, Grice), phản hồi streaming mượt mà.

### [EPIC-05] Safe Harbor Frontend & Real-time Integration
*   **Mô tả:** Xây dựng giao diện người dùng tối giản và ấm áp.
*   **User Stories Key:**
    *   Là người dùng, tôi muốn một không gian nhắn tin yên tĩnh, mang lại cảm giác an toàn.
*   **Kết quả:** Web App hoàn chỉnh (React/Next.js), kết nối realtime qua Socket.io, hiển thị được các trạng thái "Đang gõ...", "Đang suy nghĩ...".

### [EPIC-06] Empathy Safety & Vibe Monitoring (Stage 4)
*   **Mô tả:** Giám sát chất lượng và an toàn của phản hồi AI trước khi đến tay người dùng.
*   **User Stories Key:**
    *   Là hệ thống, tôi muốn ngăn chặn AI bị thao túng hoặc phá vỡ nhân vật (Prompt Injection).
*   **Kết quả:** Stage 4 Monitor hoạt động, cập nhật Session Vibe vào Redis sau mỗi lượt chat.

### [EPIC-07] Offline Intelligence & Memory Management (Stage 5)
*   **Mô tả:** Xử lý các tác vụ nặng sau khi phiên trò chuyện kết thúc.
*   **User Stories Key:**
    *   Là hệ thống, tôi muốn nén các đoạn chat dài thành các mẩu ký ức gọn nhẹ để tiết kiệm bộ nhớ.
*   **Kết quả:** BullMQ Workers hoạt động ngầm, thực hiện nén ký ức (Memory Compression) và lưu vào DB.

### [EPIC-08] Bonding Evolution & Persona Growth
*   **Mô tả:** Triển khai logic tiến hóa mối quan hệ giữa Người dùng và AI.
*   **User Stories Key:**
    *   Là người dùng, tôi muốn thấy mối quan hệ với AmiSoul ngày càng thân thiết và sâu sắc hơn theo thời gian.
*   **Kết quả:** Logic Bonding Score hoạt động, DPE Persona tự động cập nhật dựa trên lịch sử tương tác.

### [EPIC-09] Quality Assurance & Production Launch
*   **Mô tả:** Đảm bảo hệ thống đạt tiêu chuẩn sản xuất (Production-ready).
*   **Kết quả:** Đạt mục tiêu Latency < 3s, pass 1000 CCU load test, hệ thống vận hành ổn định trên Cloud.
