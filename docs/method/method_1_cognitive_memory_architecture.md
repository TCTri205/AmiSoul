# Phương án 1: Kiến trúc Trí nhớ Nhận thức (Cognitive Memory Architecture - CMA)

Dựa trên nghiên cứu về cơ chế trí nhớ của con người, phương án này tập trung vào việc xây dựng một hệ thống lưu trữ không chỉ là "kho chứa dữ liệu" mà là một **tiến trình xử lý thông tin chủ động**, có khả năng tự củng cố và chọn lọc.

## 1. Cấu trúc Phân tầng Trí nhớ (Tiered Memory System)

Hệ thống được chia thành 3 lớp chính tương ứng với mô hình tâm lý học:

### 1.1. Sensory & Input Buffer (Bộ đệm Cảm giác)
- **Chức năng:** Tiếp nhận Stream hội thoại thô, phân tích Intent và Sentiment tức thời.
- **Cơ chế Lọc (The Gatekeeper):** Sử dụng một LLM nhỏ (hoặc Classifier) để phân loại thông tin:
    - **Noise:** Chào hỏi, câu đưa đẩy (Bỏ qua hoặc lưu log thô).
    - **Signal:** Sự kiện mới, cảm xúc mạnh, sự thay đổi quan điểm (Đưa vào hàng chờ xử lý).
- **Mục tiêu:** Giảm nhiễu cho Vector Database và tiết kiệm chi phí xử lý.

### 1.2. Working Memory (Trí nhớ Làm việc)
- **Chức năng:** Quản lý Context Window của LLM hiện tại.
- **Cơ chế:** 
    - Kết hợp `Conversation History` (ngắn hạn) + `Retrieved Context` (truy xuất từ Long-term).
    - **Episodic Buffer:** Tổng hợp các mảnh thông tin rời rạc từ Database thành một "Scene" (ngữ cảnh hoàn chỉnh) trước khi đưa vào Prompt.

### 1.3. Long-term Associative Network (Trí nhớ Dài hạn)
- **Chức năng:** Lưu trữ tri thức bền vững dưới dạng Graph kết hợp Vector.
- **Cấu trúc:**
    - **Semantic Nodes (Thực thể):** Thông tin tĩnh về User (Tên, tuổi, sở thích, người thân).
    - **Episodic Nodes (Sự kiện):** Các mốc thời gian quan trọng gắn với cảm xúc (Ví dụ: "User chia tay người yêu vào thứ Hai, cảm thấy tuyệt vọng").
    - **Affective Tags:** Mỗi nút thông tin đều được "ghim" một vector cảm xúc (An toàn, Tin cậy, Lo âu).

---

## 2. Các Tiến trình Logic Cốt lõi

### 2.1. Cơ chế Củng cố (Consolidation Service)
- **Hoạt động:** Chạy định kỳ (Offline/Background) khi User không tương tác.
- **Logic:** 
    1. Quét các hội thoại trong ngày.
    2. Trích xuất các `Key Facts` và `Events`.
    3. **Summarization:** Tóm tắt các chuỗi đối thoại dài thành các "Ký ức sự kiện" ngắn gọn.
    4. Cập nhật vào Long-term Memory và xóa bỏ các chi tiết thừa trong Log thô.

### 2.2. Cơ chế Quên & Giảm trọng số (Decay Function)
- **Logic:** Mỗi nút thông tin trong Vector DB sẽ có một trọng số `Importance` và `Recency`.
- **Công thức:** `Rank = (Importance * Recency_Weight) / Frequency_of_Access`.
- **Mục tiêu:** Đảm bảo khi AI truy xuất (RAG), những thông tin quan trọng hoặc mới nhất sẽ nổi lên trên, tránh bị loãng bởi dữ liệu cũ không còn giá trị.

### 2.3. Truy xuất theo Liên tưởng (Spreading Activation Retrieval)
- **Logic:** Thay vì chỉ tìm kiếm theo từ khóa (Keyword) hoặc Vector tương đồng đơn thuần, hệ thống sẽ thực hiện "Truy vấn mở rộng".
- **Ví dụ:** Khi User nói về "Căng thẳng công việc", hệ thống sẽ tự động kích hoạt các node liên quan như "Dự án A", "Sếp B", "Thói quen uống cafe để bình tĩnh" đã lưu trước đó để tạo phản hồi có chiều sâu.

---

## 3. Lợi ích của Phương án
- **Tính nhất quán:** AI không bị "quên" những gì đã nói hoặc những sự kiện quan trọng của User.
- **Sự tinh tế:** Khả năng liên tưởng giúp AI trò chuyện tự nhiên như một người bạn thực sự hiểu rõ cuộc sống của User.
- **Hiệu năng:** Việc lọc noise và củng cố định kỳ giúp database luôn gọn nhẹ và chính xác.
