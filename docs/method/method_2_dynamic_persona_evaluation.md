# Phương án 2: Hệ thống Đánh giá & Thích nghi Persona Động (Dynamic Persona Evaluation - DPE)

Phương án này tập trung vào việc mô phỏng cách bộ não con người xây dựng "Mental Model" về người đối diện, từ đó giúp AmiSoul không chỉ phản hồi dựa trên dữ liệu mà còn **thích nghi theo tâm lý và hệ giá trị** của từng người dùng.

## 1. Cấu trúc Mô hình Người dùng (The User Mental Model)

Hệ thống sẽ xây dựng một Profile động cho mỗi User dựa trên 3 trụ cột:

### 1.1. Central Traits (Đặc điểm Mỏ neo)
- **Cơ chế:** Xác định 3-5 tính cách chủ đạo của User (Ví dụ: *Hành động - Lý trí - Hướng nội* hoặc *Cảm xúc - Nhạy cảm - Nghệ thuật*).
- **Ứng dụng:** Đây là "bộ lọc" cho Persona của AI. 
    - Với User lý trí: AmiSoul sẽ dùng ngôn ngữ trực diện, giải quyết vấn đề.
    - Với User nhạy cảm: AmiSoul sẽ ưu tiên sự thấu cảm, lắng nghe và dùng nhiều từ ngữ biểu cảm.

### 1.2. Weighted Interaction Algebra (Đại số Trọng số)
- **Cơ chế:** Mỗi tương tác mới sẽ cập nhật lại "điểm số" về sở thích, quan điểm của User.
- **Tính ổn định:** Hệ thống sử dụng cơ chế **Đồng hóa (Assimilation)**. Những thay đổi nhỏ sẽ không làm thay đổi ngay lập tức Persona của User trong mắt AI, tránh tình trạng AI bị "xoay như chong chóng" theo tâm trạng nhất thời của User.

### 1.3. Prediction Error Engine (Cơ chế Phát hiện Bất thường)
- **Logic:** AI luôn chạy một giả lập ngầm: "Dựa trên Persona hiện tại, User có khả năng sẽ phản ứng thế nào?".
- **Trigger:** Nếu phản ứng thực tế của User sai lệch quá lớn so với dự đoán (High Prediction Error), hệ thống sẽ:
    - Đánh dấu đây là một **Sự kiện quan trọng (Episodic Node)**.
    - Kích hoạt trạng thái "Tìm hiểu sâu": AI sẽ đặt các câu hỏi mở để hiểu lý do của sự thay đổi (Ví dụ: "Dạo này mình thấy bạn hơi khác, có chuyện gì xảy ra khiến quan điểm của bạn thay đổi không?").

---

## 2. Quy trình Xử lý Tương tác Xã hội (Social Loop)

Thay vì chỉ Input -> Gen Output, AmiSoul sẽ thực hiện vòng lặp 4 bước:

1.  **Interpretation (Giải mã ý định):** 
    - Phân tích Text + Sentiment + Metadata (thời gian, tần suất nhắn).
    - Gán nhãn mục đích: "User đang cần sự an ủi" hay "User đang muốn chia sẻ thành công".
2.  **Mental Simulation (Giả lập Tư duy):**
    - Chạy thử nghiệm ngầm: "Nếu mình trả lời theo cách A, với tính cách của User, họ sẽ cảm thấy thế nào?".
    - Lọc bỏ các phản hồi có khả năng gây xung đột với "Central Traits" của User.
3.  **Dynamic Response Generation:**
    - Tạo câu trả lời đã được "tinh chỉnh" theo vibe và hệ thuật ngữ (terminology) mà User thường dùng.
4.  **Feedback Integration:**
    - Quan sát phản ứng tiếp theo của User để đánh giá độ chính xác của Mental Model và cập nhật trọng số.

---

## 3. Lợi ích của Phương án
- **Sự thấu cảm sâu sắc:** AI không chỉ "nhớ" mà còn "hiểu" tại sao User lại hành động như vậy.
- **Tính cá nhân hóa cao độ:** Mỗi người dùng sẽ cảm thấy AmiSoul là một phiên bản duy nhất dành riêng cho họ, có cùng "tần số" giao tiếp.
- **Sự ổn định tâm lý:** AI đóng vai trò như một mỏ neo cảm giác, biết khi nào cần giữ vững lập trường và khi nào cần điều chỉnh theo User.

---

## 4. Bảng so sánh Sự dịch chuyển Logic

| Tiếp cận thông thường (Static AI) | Tiếp cận theo DPE (Human-like AI) |
| :--- | :--- |
| Lưu "User thích màu xanh". | Hiểu "User ưu tiên sự bình yên và tối giản". |
| Phản hồi giống nhau cho mọi User. | Thay đổi giọng điệu và phương pháp tiếp cận theo Central Traits. |
| Coi mọi câu nói đều có giá trị ngang nhau. | Ưu tiên các sự kiện có Prediction Error cao để cập nhật model. |
| Trả lời dựa trên context window. | Trả lời dựa trên giả lập phản ứng của User (Theory of Mind). |
