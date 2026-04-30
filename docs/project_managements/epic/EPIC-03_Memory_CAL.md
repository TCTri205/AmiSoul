# [EPIC-03] Affective Memory & CAL System (Stage 2)

## 1. Mô tả
Triển khai hệ thống bộ nhớ nhận thức (CMA) và tầng nhận thức ngữ cảnh (CAL). Epic này cung cấp "ký ức" và "nhận thức thời gian" cho AmiSoul, giúp AI không chỉ nhớ sự kiện mà còn thấu hiểu cảm xúc đi kèm và những mong đợi dở dang của người dùng.

## 2. Tiêu chí Chấp nhận (Acceptance Criteria)
- [ ] Kích hoạt Extension `pgvector` trên PostgreSQL thành công.
- [ ] **Affective Retrieval:** Thuật toán truy xuất kết hợp độ tương đồng Vector (Cosine Similarity) và sự tương đồng cảm xúc (Sentiment Alignment).
- [ ] **CAL L1 (Redis):** Quản lý các sự kiện "nóng" (`Expectations`, `Pending States`) với độ trễ truy xuất < 10ms.
- [ ] **CAL L2 (PostgreSQL):** Lưu trữ bền vững các trạng thái CAL dài hạn.
- [ ] **Context Merging:** Hợp nhất Context từ 4 nguồn (Vibe, CAL, CMA, History) theo tỷ lệ Budget 3000 tokens.
- [ ] Nhận diện được sự lệch chuẩn hành vi (`Behavioral_Baseline`) dựa trên lịch sử hoạt động.

## 3. Danh sách Tác vụ (Technical Tasks)
- **T3.1:** Cấu hình Prisma Client để thực hiện `$queryRaw` tìm kiếm vector trên bảng `Memories`.
- **T3.2:** Xây dựng `ContextRetrieverService` để điều phối việc lấy dữ liệu từ Redis và PostgreSQL song song.
- **T3.3:** Triển khai logic `Truth Hierarchy`: Ưu tiên thông tin từ CAL (Sự kiện đang diễn ra) > CMA (Ký ức cũ).
- **T3.4:** Xây dựng cơ chế nhúng (Embedding) sử dụng Gemini Embedding API cho các câu hỏi của người dùng.
- **T3.5:** Triển khai `Time_Anomaly_Detector` để nhận biết các yêu cầu ngoài khung giờ sinh hoạt thông thường.
- **T3.6:** Tích hợp `Bonding_Gate`: Giới hạn mức độ nhạy cảm của ký ức được truy xuất dựa trên điểm thân thiết hiện tại.
- **T3.7:** Viết Unit Test cho logic trộn Context (Context Injection Logic).

## 4. Rủi ro & Giảm thiểu (Risks & Mitigation)
- **Rủi ro:** Số lượng ký ức quá lớn làm chậm query Vector.
- **Giảm thiểu:** Sử dụng Index HNSW (Hierarchical Navigable Small World) và phân mảnh ký ức theo `user_id`.

## 5. Phụ thuộc (Dependencies)
- **Epic:** [EPIC-01], [EPIC-02].
- **Tài liệu:** [TechnicalArchitecture.md](file:///d:/Persional_Projects/AmiSoul/docs/architecture/TechnicalArchitecture.md) (Phần 2.2 & 3.0).
