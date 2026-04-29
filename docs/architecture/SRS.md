# Đặc tả Yêu cầu Phần mềm (SRS) - AmiSoul

**Dự án:** AmiSoul - Người Bạn Đồng Hành AI Thấu Cảm
**Phiên bản:** v3.0.0
**Trạng thái:** Nguồn Sự thật Duy nhất (Single Source of Truth)
**Cập nhật lần cuối:** 2026-04-29

---

## 1. Giới thiệu
Tài liệu này xác định các mục tiêu chức năng, phi chức năng, trải nghiệm người dùng và các ràng buộc kỹ thuật logic cho nền tảng AmiSoul.

## 2. Yêu cầu Chức năng

### 2.1. Trí tuệ Hội thoại (FR-01)
- **FR-01.1:** Hỗ trợ hội thoại đa lượt, nhận biết ngữ cảnh bằng tiếng Việt.
- **FR-01.2:** Duy trì một tính cách (persona) nhất quán và thấu cảm trong suốt phiên làm việc.
- **FR-01.3:** Thích ứng phong cách phản hồi dựa trên ngữ cảnh cảm xúc được nhận diện.
- **FR-01.4:** Hỗ trợ phân phối tin nhắn phản hồi nhanh để đảm bảo luồng hội thoại.

### 2.2. Bộ nhớ Mối quan hệ (FR-02)
- **FR-02.1:** Tự động nhận diện và ghi lại các thông tin quan trọng từ các lần tương tác.
- **FR-02.2:** Duy trì thông tin dựa trên mức độ liên quan đến mối quan hệ giữa người dùng và AI.
- **FR-02.3:** Cung cấp các ký ức liên quan để hỗ trợ các tương tác hiện tại.

### 2.3. Tương tác Chủ động (FR-03)
- **FR-03.1:** Cho phép các tương tác nhận biết ngữ cảnh dựa trên thói quen hoặc hoạt động của người dùng.
- **FR-03.2:** Các mô thức tương tác phải xem xét ngữ cảnh thời gian (ví dụ: thời điểm trong ngày).

### 2.4. Quản lý An toàn & Khủng hoảng (FR-04)
- **FR-04.1:** Giám sát thời gian thực các chỉ số tâm lý tiêu cực cực đoan hoặc ý định tự hại.
- **FR-04.2:** Ưu tiên xác nhận thấu cảm và cung cấp thông tin hỗ trợ phù hợp.

---

## 3. Yêu cầu Phi chức năng

### 3.1. Hiệu suất (NFR-01)
- **Độ phản hồi:** Nhịp điệu tương tác phải hỗ trợ luồng hội thoại tự nhiên.
- **Khả năng mở rộng:** Hệ thống phải xử lý lượng người dùng tăng trưởng một cách hiệu quả.
- **Độ khả dụng:** Đảm bảo truy cập nhất quán vào các dịch vụ tương tác cốt lõi.

### 3.2. An ninh & Quyền riêng tư (NFR-02)
- **Quản lý Định danh:** Quản lý an toàn các phiên làm việc và hồ sơ người dùng.
- **Cách ly Dữ liệu:** Đảm bảo tách biệt logic tuyệt đối giữa thông tin của các người dùng khác nhau.
- **Mã hóa:** Xử lý an toàn tất cả dữ liệu trong quá trình truyền tải và lưu trữ.
- **Quyền riêng tư:** Hỗ trợ tương tác ẩn danh hoặc sử dụng biệt hiệu.

### 3.3. Độ tin cậy (NFR-03)
- **Khả năng phục hồi:** Xử lý nhẹ nhàng các gián đoạn hoặc suy giảm dịch vụ.
- **Tính toàn vẹn:** Các cơ chế đảm bảo tính nhất quán và chính xác của thông tin được lưu trữ.

---

## 4. Trải nghiệm & Giao diện (UI/UX)

### 4.1. Triết lý Thiết kế
Giao diện được thiết kế như một **"Bến đỗ An toàn"** (Safe Harbor), tối giản để tập trung hoàn toàn vào kết nối cảm xúc thông qua hội thoại.
- **Chủ đề Thẩm mỹ:** "Yên tĩnh & Thân mật" (Quiet & Intimate).
- **Nhịp điệu:** Mô phỏng sự suy ngẫm và luồng hội thoại tự nhiên của con người.

### 4.2. Nguyên tắc Tương tác
- **Onboarding:** Tham gia tức thì, không sử dụng biểu mẫu tĩnh, tìm hiểu qua đối thoại tự nhiên.
- **Nhận biết Ngữ cảnh:** Giao diện ghi nhận trực quan về mối quan hệ đang tiếp diễn.
- **An toàn Cảm xúc:** Đảm bảo trải nghiệm luôn mang lại cảm giác như một "vùng không phán xét".

---

## 5. Ràng buộc Kỹ thuật Logic

### 5.1. Quản lý Bộ nhớ Ngữ cảnh
- **Vòng đời:** Nhận diện -> Biểu diễn -> Truy xuất -> Cập nhật thông tin tự động.
- **Trọng số:** Ưu tiên thông tin Cơ bản (bản sắc) và Bền bỉ (sở thích) hơn thông tin Tình huống.

### 5.2. Luồng Giao tiếp
- **Truyền tải:** Hỗ trợ luồng dữ liệu thời gian thực cho hội thoại.
- **Trích xuất:** Nhận diện thông tin mới một cách bất đồng bộ để không làm gián đoạn hội thoại.
- **Xử lý Lỗi:** Truyền đạt các trạng thái lỗi hệ thống một cách nhẹ nhàng cho người dùng.

---

## 6. Mục tiêu Nghiên cứu & Quyết định Tiếp theo
- Xác định mô hình suy luận tối ưu cho sắc thái tiếng Việt.
- Thiết kế cấu trúc lưu trữ vector cho dữ liệu đa người dùng.
- Tinh chỉnh logic trích xuất thông tin thực tế từ đối thoại.
