# [EPIC-03] Affective Memory & CAL System (Stage 2)

## 1. Mô tả
Xây dựng hệ thống lưu trữ và truy xuất ký ức theo cảm xúc (Affective Memory) và quản lý các sự kiện đang diễn ra (Cognitive Anticipation Layer - CAL). EPIC này đảm bảo AI có khả năng nhớ lại quá khứ một cách chọn lọc và nhận thức được các bối cảnh hiện tại của người dùng.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] **CMA (Comprehensive Memory Archive):** Truy xuất ký ức episodic sử dụng pgvector với thuật toán Affective Retrieval.
- [ ] **CAL (Cognitive Anticipation Layer):** Lấy dữ liệu sự kiện nóng từ Redis (L1) và PostgreSQL (L2).
- [ ] **Truth Hierarchy:** Giải quyết mâu thuẫn thông tin theo thứ tự ưu tiên: Persona Shield > Session Vibe > Bonding > DPE > CMA.
- [ ] **Time Anomaly:** Nhận diện các thay đổi bất thường trong thói quen sinh hoạt của người dùng.
- [ ] **Bonding Filter:** Giới hạn độ sâu và độ nhạy cảm của ký ức truy xuất dựa trên điểm thân thiết.

## 3. Danh sách Tác vụ (Technical Tasks)
- **[T3.1: Prisma Vector Query](../ticket/Sprint-03/T3.1_Prisma_Vector_Query.md)**
- **[T3.2: Context Retriever Service](../ticket/Sprint-03/T3.2_Context_Retriever_Service.md)**
- **[T3.3: Truth Hierarchy Logic](../ticket/Sprint-03/T3.3_Truth_Hierarchy_CAL_CMA.md)**
- **[T3.4: Gemini Embedding API](../ticket/Sprint-03/T3.4_Gemini_Embedding_API.md)**
- **[T3.5: Time Anomaly Detector](../ticket/Sprint-03/T3.5_Time_Anomaly_Detector.md)**
- **[T3.6: Bonding Gate Sensitivity](../ticket/Sprint-03/T3.6_Bonding_Gate_Sensitivity.md)**
- **[T3.7: Context Injection Test](../ticket/Sprint-03/T3.7_Context_Injection_Test.md)**
- **[T3.8: Prisma Encryption Middleware](../ticket/Sprint-03/T3.8_Prisma_Encryption_Middleware.md)**

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Truy xuất quá nhiều ký ức dẫn đến tràn Context Window (Token Budget).
- **Giảm thiểu:** Thiết lập **Token Budget Manager** (Sprint 04) và thuật toán xếp hạng Affective Score để chỉ lấy 3-5 ký ức liên quan nhất.

## 5. Phụ thuộc (Dependencies)
- **Hạ tầng:** PostgreSQL với pgvector extension.
- **Tài liệu:** [TechnicalArchitecture.md](../../architecture/TechnicalArchitecture.md) (Phần 2.2).
