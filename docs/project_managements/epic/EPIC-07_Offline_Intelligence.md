# [EPIC-07] Offline Intelligence & Memory Management (Stage 5)

## 1. Mô tả
Triển khai hệ thống xử lý tác vụ nền (Background Jobs) để củng cố tri thức và tối ưu hóa tài nguyên. EPIC này tập trung vào Stage 5 của Pipeline, thực hiện các công việc nặng sau khi phiên trò chuyện kết thúc mà không ảnh hưởng đến trải nghiệm thời gian thực.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [x] **BullMQ Infrastructure:** Hệ thống Queue hoạt động ổn định với Redis, có Dashboard giám sát.
- [x] **Memory Compression:** Nén log chat thô thành các Episodic Nodes súc tích mang tính tự sự.
- [x] **Conflict Resolution:** Tự động phát hiện và đánh dấu `Superseded` cho các ký ức cũ bị mâu thuẫn.
- [x] **Knowledge Linking:** Liên kết các mẩu ký ức rời rạc thành một đồ thị tri thức đơn giản về người dùng.
- [x] **Session Cleanup:** Tự động dọn dẹp các session rác và giải phóng tài nguyên định kỳ.

## 3. Danh sách Tác vụ (Technical Tasks)
- **[T7.1: BullMQ Module Setup](../ticket/Sprint-07/T7.1_BullMQ_Module_Setup.md)**
- **[T7.2: Memory Compression Worker](../ticket/Sprint-07/T7.2_Memory_Compression_Worker.md)**
- **[T7.3: Consolidation Orchestrator](../ticket/Sprint-07/T7.3_Consolidation_Service_Orchestrator.md)**
- **[T7.4: Knowledge Linking Logic](../ticket/Sprint-07/T7.4_Knowledge_Linking_Logic.md)**
- **[T7.5: Memory Conflict Resolution](../ticket/Sprint-07/T7.5_Memory_Conflict_Resolution.md)**
- **[T7.6: Session Cleanup Scheduler](../ticket/Sprint-07/T7.6_Session_Cleanup_Scheduler.md)**
- **[T7.7: Compression Worker Test](../ticket/Sprint-07/T7.7_Compression_Worker_Test.md)**

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** LLM tóm tắt làm mất các chi tiết quan trọng trong ký ức.
- **Giảm thiểu:** Thiết kế Prompt tóm tắt giữ lại các "Emotional Anchors" và thực thể định danh.

## 5. Phụ thuộc (Dependencies)
- **Hạ tầng:** Redis (BullMQ), PostgreSQL.
- **Tài liệu:** [TechnicalArchitecture.md](../../architecture/TechnicalArchitecture.md) (Phần 4.0).
