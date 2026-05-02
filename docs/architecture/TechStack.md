# Lựa chọn Công nghệ (Tech Stack) - AmiSoul

**Phiên bản:** ACE v2.1 (v3.0.0)
**Cập nhật lần cuối:** 2026-04-30

Tài liệu này xác định các công nghệ cụ thể được chọn để triển khai **AmiSoul Cognitive Engine (ACE v2.1)**, đảm bảo đáp ứng các tiêu chuẩn về độ trễ thấp (< 3s), khả năng thấu cảm cao và tính bền vững của dữ liệu bằng cách sử dụng hệ sinh thái **Full-stack TypeScript**.

---

## 1. Tổng quan Stack
| Tầng | Công nghệ Đề xuất | Lý do Lựa chọn |
|---|---|---|
| **Backend Framework** | **Node.js / NestJS** | Kiến trúc mạnh mẽ, hỗ trợ Dependency Injection, Type-safety đồng nhất với Frontend. |
| **Real-time Comm** | **Socket.io** | Hỗ trợ WebSockets với cơ chế fallback tốt, dễ dàng tích hợp với NestJS. |
| **Database (Primary)** | **PostgreSQL + pgvector** | Lưu trữ quan hệ (Bonding, CAL) và Vector (CMA) đồng nhất. (Dev: Supabase). |
| **Database ORM** | **Prisma** | Type-safe queries, hỗ trợ tốt migration và tích hợp pgvector qua raw SQL. |
| **Cache & Real-time State** | **Redis** | Lưu trữ RAM cho Session Vibe, CAL L1, và Message Buffer. (Dev: Upstash). |
| **AI Orchestration** | **NestJS Services** | Tối ưu logic Pipeline ACE v2.1 trực tiếp trong service để kiểm soát tốt Latency. |
| **Vector Search** | **pgvector** | Tìm kiếm ký ức theo cảm xúc (Affective Retrieval) với HNSW Index. |
| **Task Queue (Stage 5)** | **BullMQ (Redis-based)** | Xử lý Background Jobs cực nhanh và tin cậy trong Node.js. |

---

## 2. Chi tiết Lớp Trí tuệ Nhân tạo (AI Model Layer)

Dù Backend dùng TypeScript, các mô hình AI nặng vẫn được chạy dưới dạng các Microservices hoặc gọi qua API:

### 2.1. Perception & Router (Stage 1)
- **Model:** **Gemini-2.5-Flash** (Cloud API) hoặc **Gemma-2b** (Local SLM).
- **Chiến lược:** Giai đoạn phát triển ưu tiên dùng Gemini API với System Prompt chuyên biệt để phân tích sentiment/intent nhằm tiết kiệm RAM.
- **Hosting (Production):** Tự host qua **vLLM** hoặc **Ollama** nếu cần offline.

### 2.2. Unified Simulation Engine (Stage 3)
- **Model:** **Gemini-2.5-Flash** (Cloud API).
- **Lý do:** Tốc độ nhanh, chi phí thấp, hỗ trợ Context Window lớn. Tích hợp trực tiếp qua SDK Google AI trên Node.js.
- **Nhiệm vụ:** Sinh phản hồi thấu cảm dựa trên Context Budget 3000 tokens.

### 2.3. Media Processing (Stage 0)
- **STT & Vision:** Ưu tiên dùng API (OpenAI Whisper / Gemini Vision) trong giai đoạn phát triển để tối ưu hóa tài nguyên laptop.

---

## 3. Lớp Dữ liệu & Trạng thái (Data & State Layer)

### 3.1. Redis (RAM Cache - L1)
- **Session Vibe:** Lưu trữ dưới dạng JSON. TTL 30 phút.
- **CAL L1 (Expectations/Pending):** Truy xuất cực nhanh để kiểm tra ở Stage 1.
- **Message Debounce:** Dùng Redis Key với EXPIRE để quản lý cửa sổ gom tin.

### 3.2. PostgreSQL (Persistent - L2)
- **Users Table:** Thông tin cơ bản.
- **Bonding Table:** Lưu `Bonding_Score` và lịch sử tiến hóa.
- **CAL L2 Table:** Lưu trữ vĩnh viễn các sự kiện, thói quen (Behavioral Baseline).
- **CMA Table (pgvector):** Lưu Episodic Nodes (Vector + Metadata).

---

## 4. Hạ tầng & Triển khai (Infrastructure)

- **Runtime:** **Node.js (LTS)**.
- **Containerization:** **Docker & Docker Compose**.
    - **Local Dev (Hybrid Strategy):** Chỉ chạy Database (PostgreSQL) và Cache (Redis) trong Docker. Ứng dụng NestJS chạy trực tiếp trên máy local (`npm run dev`) để tiết kiệm RAM, CPU và giảm thời gian build.
    - **Production:** Toàn bộ hệ thống được container hóa hoàn toàn để đảm bảo tính nhất quán.
- **API Gateway:** **Nginx** xử lý SSL và Load Balancing.
- **Monitoring:** **Prometheus & Grafana** tích hợp với NestJS qua Prometheus module (exporter).
- **Logging:** **Winston / Pino** để ghi log có cấu trúc.

---

## 5. Đánh giá tính khả thi (SLO Validation)

Độ trễ dự kiến với Node.js / NestJS (Non-blocking I/O giúp xử lý đồng thời nhiều Stage tốt hơn):
1. **Stage 1 (SLM Call):** ~200-400ms.
2. **Stage 2 (Prisma + Redis):** ~40-80ms.
3. **Stage 3 (Gemini 2.5 Flash SDK):** ~800-1500ms.
4. **Stage 4 (Node.js Logic):** ~50-100ms.
- **Tổng cộng:** ~1.1s - 2.1s (Đạt mục tiêu < 3s).
