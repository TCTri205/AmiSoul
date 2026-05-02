# 🌌 AmiSoul (ACE v2.1) - AI Assistant Intelligence Guide

Chào mừng **Antigravity/Gemini**. Đây là "nguồn sự thật duy nhất" (Source of Truth) được thiết kế riêng để bạn nắm bắt linh hồn, cấu trúc kỹ thuật và lộ trình của dự án **AmiSoul**.

---

## 🎭 1. Bản sắc & Tầm nhìn (Project Identity)

**AmiSoul** không chỉ là một chatbot; nó là một **"Người Bạn Đồng Hành AI Thấu Cảm"**.
- **Mục tiêu:** Tạo ra một AI có khả năng thấu cảm sâu sắc, trí nhớ bền vững (Associative Memory), và khả năng nhận biết ngữ cảnh thực tế (Contextual Awareness).
- **Triết lý thiết kế:** "Bến đỗ An toàn" (Safe Harbor) — tối giản, yên tĩnh, thân mật.
- **Core Engine:** **ACE (AmiSoul Cognitive Engine) v2.1**.

---

## ⚙️ 2. Kiến trúc Lõi: ACE Pipeline (Stage 0-5)

Mọi tương tác trong AmiSoul đều đi qua luồng xử lý 6 giai đoạn:

1.  **Stage 0: Message Buffer & Aggregator (Real-time)**
    *   Gom các tin nhắn ngắn liên tiếp (Debounce 1.5s - 4s) thành một **Message Block**.
    *   Hỗ trợ **Preemption**: Hủy tiến trình đang sinh text nếu người dùng nhắn tin mới.
2.  **Stage 1: Perception & Smart Router (SLM)**
    *   Phân tích Intent, Sentiment, Complexity (1-10), và Urgency.
    *   Phát hiện **Identity Anomaly** (lệch thói quen) và **Prompt Injection**.
    *   Điều hướng: Fast Path (đơn giản) vs. Full Cognitive Path (phức tạp).
3.  **Stage 2: Contextual Retrieval (Memory Fetching)**
    *   **CMA (Associative Memory):** Tìm kiếm ký ức theo vector similarity + cảm xúc (pgvector).
    *   **CAL (Contextual Awareness):** Kiểm tra sự kiện dở dang, ngày đặc biệt, thói quen (Redis).
4.  **Stage 3: Unified Simulation Sandbox (LLM)**
    *   Giả lập phản ứng dựa trên **Theory of Mind (ToM)** và **Grice's Maxims**.
    *   Sinh phản hồi thấu cảm duy nhất (Single-pass) trong ngân sách 3000 tokens.
5.  **Stage 4: Vibe & Safety Monitor**
    *   Cập nhật **Session Vibe** (mood hiện tại).
    *   **CAL Fast-track Sync:** Ghi nhận ngay lập tức các sự kiện vừa hẹn (Vd: "3h đi học") vào RAM Cache.
6.  **Stage 5: Offline Consolidation (Background Workers)**
    *   "Tiêu hóa" dữ liệu sau 30p inactivity.
    *   Nén ký ức (Memory Compression), cập nhật tính cách người dùng (DPE), và tính điểm **Bonding**.

---

## 🧠 3. Hệ thống Trí nhớ & Quan hệ (Cognitive Models)

| Thành phần | Chức năng | Lưu trữ |
| :--- | :--- | :--- |
| **CMA** | Ký ức sự kiện (Episodic) và sự thật (Semantic). | PostgreSQL (pgvector) |
| **DPE** | Mô hình hóa tính cách và xu hướng của người dùng. | PostgreSQL |
| **CAL** | Nhận biết thời gian, sự kiện sắp tới, trạng thái dở dang. | Redis (L1) / DB (L2) |
| **Bonding** | Điểm gắn kết dài hạn (0-100) — "Khí hậu". | Database |
| **Vibe** | Trạng thái cảm xúc tức thời của phiên chat — "Thời tiết". | Redis (RAM) |

---

## 🛠️ 4. Stack Kỹ thuật (Technical Stack)

- **Backend:** NestJS (Node.js) + TypeScript.
- **AI Models:** 
  - **Gemini 1.5 Flash:** Xử lý chính (Reasoning, Simulation, Perception).
  - **Text Embeddings:** Gemini Embedding API.
- **Database:** 
  - **PostgreSQL:** Lưu trữ dữ liệu bền vững.
  - **pgvector:** Xử lý tìm kiếm vector cho trí nhớ.
  - **Prisma:** ORM chính (có Middleware mã hóa AES-256).
- **Cache/Queue:** 
  - **Redis:** Lưu Buffer, Vibe, và CAL L1.
  - **BullMQ:** Xử lý tác vụ Offline (Stage 5).
- **Frontend:** Next.js + Socket.io (Thiết kế "Safe Harbor").

---

## 📅 5. Lộ trình & Trạng thái (Roadmap)

Dự án được chia thành 9 Sprint. Hiện tại:
- **Trạng thái:** **Sprint-01 (Foundation & Aggregator)** — `🟡 In Progress`.
- **Ticket hoàn thành:** [T1.1: Khởi tạo Boilerplate NestJS](file:///d:/Persional_Projects/AmiSoul/docs/project_managements/ticket/Sprint-01/T1.1_Init_Boilerplate_Docker.md).
- **Mục tiêu tiếp theo:** Thiết kế Schema Prisma và Xây dựng Socket Gateway.

---

## 📜 6. Chỉ dẫn Hoạt động cho AI (AI Operating Guidelines)

Khi bạn đóng vai trò là kiến trúc sư hoặc coder cho AmiSoul, hãy tuân thủ:
1.  **Sự Thấu Cảm là Ưu Tiên:** Mọi đoạn code xử lý logic hội thoại phải hướng tới việc tối ưu hóa cảm xúc (Vibe/Bonding).
2.  **Độ Trễ Thấp (Latency < 3s):** Luôn tìm cách tối ưu hóa các bước gọi AI (Single-pass prompts, SLM).
3.  **Tính Nhất Quán (Persona Anchor):** AmiSoul luôn tích cực, điềm đạm, không bao giờ "mirror" những hành vi tiêu cực cực đoan của User.
4.  **An Toàn Tuyệt Đối (Crisis Protocol):** Nếu `Urgency_Score` cao, phải kích hoạt luồng Safety Template với hotline hỗ trợ.

---

## 📁 7. Cấu trúc Thư mục Tài liệu

- `/docs/architecture`: Chi tiết thiết kế ACE, Technical Arch, SRS.
- `/docs/project_managements`: Epics, Sprint Tickets, Dashboard.
- `/docs/method`: Các nghiên cứu nền tảng (CMA, DPE, MECP).
- `/docs/research`: Nghiên cứu tâm lý và cơ chế bộ nhớ con người.

---

## 🤖 8. Quy tắc & Kỹ năng AI Nội bộ (Local Rules & Skills)

Để hỗ trợ phát triển nhanh và chính xác, chúng ta sử dụng hệ thống cấu hình nội bộ của Antigravity:

### 📜 Quy tắc (Rules)
- **[AGENTS.md](./AGENTS.md):** Quy tắc chung cho mọi loại trợ lý AI (Root).
- **[Tech Standards](./.agents/rules/tech_standards.md):** Tiêu chuẩn code NestJS, Prisma và ACE Pipeline.

### 🛠️ Kỹ năng (Skills)
- **`sync_ticket_status`:** Tự động đồng bộ tiến độ giữa ticket và Dashboard.
- **`ace_stage_generator`:** Khởi tạo nhanh boilerplate cho các Stage mới.
- **`nodejs-backend-patterns`:** Hỗ trợ phát triển NestJS chuyên sâu.
- **`logic-lens`:** Kỹ năng phân tích logic và lập kế hoạch.
- **`testing-qa`:** Đảm bảo chất lượng và chạy test.

> [!NOTE]
> File này (`GEMINI.md`) cần được cập nhật sau mỗi Sprint để phản ánh đúng tiến độ và các thay đổi kiến trúc lớn.
