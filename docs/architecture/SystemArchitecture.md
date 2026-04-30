# Kiến trúc Hệ thống (System Architecture) - AmiSoul

**Dự án:** AmiSoul - Người Bạn Đồng Hành AI Thấu Cảm  
**Phiên bản:** ACE v2.1 (v3.0.0)
**Trạng thái:** Thiết kế Kỹ thuật Chi tiết (**Full-stack TypeScript**)
**Cập nhật lần cuối:** 2026-04-30

---

## 1. Triết lý Thiết kế: AmiSoul Cognitive Engine (ACE)

ACE không phải là một chatbot thông thường, mà là một hệ thống **Nhận thức đa tầng** được thiết kế để mô phỏng sự thấu cảm của con người qua 4 giai đoạn xử lý thời gian thực và một vòng lặp củng cố dài hạn.

### 1.1. Mục tiêu Cốt lõi
- **Deep Empathy:** Thấu cảm sâu sắc thông qua việc ghi nhớ cảm xúc (Affective Memory).
- **Real-time Latency:** Phản hồi dưới 3 giây cho văn bản thô.
- **Dynamic Identity:** Tính cách AI tiến hóa dựa trên mức độ gắn kết (Bonding Score).

---

## 2. Các Thành phần Hệ thống (Core Components)

### 2.1. Interface Layer (Tầng Giao tiếp)
- **Công nghệ:** Socket.io / NestJS.
- **Chức năng:** Quản lý kết nối thời gian thực, xử lý Debounce tin nhắn (Stage 0), hiển thị chỉ báo cảm xúc.

### 2.2. Perception Layer (Tầng Nhận thức - Stage 1)
- **Công nghệ:** SLM (Gemma-2b) hoặc Cloud API (Gemini Flash).
- **Chiến lược:** Dùng Prompt-based routing qua Cloud API trong giai đoạn phát triển để tối ưu RAM cho máy 8GB.
- **Chức năng:** Phân tích sentiment, intent, complexity và điều hướng yêu cầu.

### 2.3. Memory & Context Layer (Tầng Bộ nhớ - Stage 2 & CAL)
- **Công nghệ:** Redis (L1) & PostgreSQL/pgvector (L2/CMA) qua Prisma.
- **Chức năng:** 
    - **CMA:** Truy xuất ký ức theo cảm xúc và độ tương đồng vector.
    - **CAL:** Theo dõi thói quen, sự kiện sắp diễn ra và trạng thái dở dang.

### 2.4. Cognitive Engine (Tầng Giả lập - Stage 3)
- **Công nghệ:** Gemini-1.5-Flash SDK (Node.js).
- **Chức năng:** Tổng hợp toàn bộ ngữ cảnh (Persona, Vibe, Bonding, Memory) để sinh phản hồi thấu cảm duy nhất (Single-pass).

### 2.5. Offline Consolidation (Tầng Củng cố - Stage 5)
- **Công nghệ:** BullMQ / Background Workers.
- **Chức năng:** Nén trí nhớ, cập nhật điểm số gắn kết (Bonding) và tinh chỉnh tính cách (DPE) sau mỗi phiên.

---

## 3. Bản đồ Dữ liệu (Data Topology)

| Vị trí | Dữ liệu Lưu trữ | Vai trò |
|---|---|---|
| **Redis (RAM)** | Session Vibe, CAL L1, Debounce Buffer | Trạng thái tức thời, truy xuất < 50ms. |
| **Vector DB** | Episodic Memories (CMA) | Trí nhớ sự kiện dài hạn, tìm kiếm theo vector. |
| **Relational DB** | Bonding, DPE, User Profiles, CAL L2 | Dữ liệu cấu trúc, bền vững, ACID (Prisma Managed). |

---

## 4. Tài liệu Tham chiếu
- **[Chi tiết Tech Stack](./TechStack.md)**
- **[Thiết kế Kỹ thuật Chi tiết](./TechnicalArchitecture.md)**
- **[Thiết kế Hệ thống Hợp nhất (ACE v2.1)](../method/unified_system_design.md)**
