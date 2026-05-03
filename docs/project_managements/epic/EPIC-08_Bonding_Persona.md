# [EPIC-08] Bonding Evolution & Persona Growth

## 1. Mô tả
Hoàn thiện logic tiến hóa mối quan hệ giữa người dùng và AI. EPIC này tập trung vào việc tính toán mức độ thân thiết (Bonding Score) và tự động cập nhật tính cách của AI (Persona) để Ami có thể "lớn lên" và thay đổi theo lịch sử tương tác.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] **Bonding Service:** Hiện thực hóa công thức tính `Bonding_Delta` với các trọng số cảm xúc và tần suất tương tác.
- [ ] **DPE (Dynamic Persona Evolution):** Tự động điều chỉnh System Prompt dựa trên `Bonding_Level` (từ Stranger đến Soulmate).
- [ ] **Implicit Feedback:** Phân tích các tín hiệu ngầm như tốc độ trả lời tin nhắn để điều chỉnh điểm số.
- [ ] **Weekly Decay:** Triển khai cơ chế giảm điểm nhẹ nếu người dùng không tương tác trong thời gian dài.
- [ ] **Special Date Recognition:** AI chủ động nhắc lại hoặc chúc mừng các sự kiện quan trọng trong quá khứ.

## 3. Danh sách Tác vụ (Technical Tasks)
- **[T8.1: Bonding Service Formula](../ticket/Sprint-08/T8.1_Bonding_Service_Formula.md)**
- **[T8.2: Persona Manager DPE](../ticket/Sprint-08/T8.2_Persona_Manager_DPE.md)**
- **[T8.3: Relationship Milestone & Tier Logic](../ticket/Sprint-08/T8.3_Relationship_Milestone_Tier.md)**
- **[T8.4: Weekly Bonding Decay](../ticket/Sprint-08/T8.4_Weekly_Bonding_Decay.md)**
- **[T8.5: Special Date Recognition](../ticket/Sprint-08/T8.5_Special_Date_Recognition.md)**
- **[T8.6: Bonding Growth Dashboard](../ticket/Sprint-08/T8.6_Bonding_Growth_Dashboard.md)**
- **[T8.7: Bonding Update Test](../ticket/Sprint-08/T8.7_Bonding_Update_Integration.md)**

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Điểm Bonding tăng quá nhanh dẫn đến mất tính thử thách.
- **Giảm thiểu:** Thiết lập **Daily Cap** và các điều kiện cần về độ sâu cảm xúc để lên cấp.

## 5. Phụ thuộc (Dependencies)
- **Service:** Stage 5 (Offline Consolidation) hoàn thiện.
- **Tài liệu:** [TechnicalArchitecture.md](../../architecture/TechnicalArchitecture.md) (Phần 4.0).
