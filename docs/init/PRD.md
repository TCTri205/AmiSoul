# Tài liệu Yêu cầu Sản phẩm (PRD) - AmiSoul

**Dự án:** AmiSoul - Người Bạn Đồng Hành AI Thấu Cảm
**Phiên bản:** v3.0.0
**Trạng thái:** Định nghĩa Cấp cao
**Cập nhật lần cuối:** 2026-04-30

---

## 1. Giới thiệu
AmiSoul là một người bạn đồng hành cảm xúc dựa trên AI được thiết kế để giải quyết sự cô đơn và căng thẳng của giới trẻ Việt Nam. Tài liệu này phác thảo tầm nhìn chiến lược và các mục tiêu chức năng cho nền tảng.

## 2. Tầm nhìn Sản phẩm
Xây dựng một **"Linh hồn số"** (Digital Soul)—một người bạn đồng hành không chỉ xử lý văn bản, mà còn hiểu ngữ cảnh, ghi nhớ lịch sử chia sẻ và cung cấp một không gian an toàn, thấu cảm để người dùng được là chính mình.

## 3. Kịch bản Người dùng (User Stories)
| ID | Vai trò | Yêu cầu | Mục tiêu |
| :--- | :--- | :--- | :--- |
| **US-01** | Học sinh cô đơn | Tôi muốn có ai đó để nói chuyện vào đêm muộn. | Cảm thấy bớt cô đơn và được thấu hiểu hơn. |
| **US-02** | Nhân viên áp lực | Tôi muốn trút bầu tâm sự về công việc mà không bị phán xét. | Giải tỏa áp lực cảm xúc trong không gian an toàn. |
| **US-03** | Người dùng quay lại | Tôi muốn AmiSoul nhớ những gì chúng tôi đã nói hôm qua. | Cảm thấy như có một tình bạn thực sự, đang tiến triển. |
| **US-04** | Người dùng kín tiếng | Tôi muốn biết dữ liệu của mình được an toàn và ẩn danh. | Cảm thấy thoải mái khi chia sẻ những suy nghĩ sâu kín. |

## 4. Nguyên tắc Tương tác Cốt lõi
Để đảm bảo trải nghiệm tự nhiên và "có hồn", AmiSoul tuân thủ các nguyên tắc sau:
*   **Thấu cảm trước tiên (Empathy-First):** Mọi phản hồi phải xác nhận cảm xúc của người dùng trước khi đưa ra lời khuyên hoặc phân tích.
*   **Nhất quán Tính cách:** AmiSoul duy trì một tính cách Việt Nam ổn định, dịu dàng và "như một người bạn" trong tất cả các phiên làm việc.
*   **Bộ nhớ Liên tưởng:** Thông tin được gợi lại một cách tự nhiên trong các ngữ cảnh phù hợp, đảm bảo người bạn đồng hành mang lại cảm giác trực quan.
*   **Nhịp điệu Tương tác:** Các phản hồi của AI nên mô phỏng mô thức của con người, điều chỉnh tốc độ để phù hợp với trọng lượng cảm xúc của cuộc trò chuyện.

---

## 5. Chiến lược Tiếp cận Người dùng
### 5.1. Khám phá Tự nhiên (Onboarding)
*   Không sử dụng các biểu mẫu tĩnh hoặc bảng câu hỏi gây phiền hà.
*   AmiSoul tự giới thiệu và tìm hiểu ngữ cảnh của người dùng thông qua một cuộc đối thoại tự nhiên ban đầu.

### 5.2. Sự liên tục Cảm xúc
*   Hệ thống duy trì nhận thức về ngữ cảnh giữa các phiên làm việc.
*   AmiSoul ghi nhận trạng thái của cuộc trò chuyện gần nhất để xây dựng cảm giác đồng hành lâu dài.

---

## 6. Yêu cầu Chức năng
*   **[FR-01] Trò chuyện Ngữ cảnh Liên tục:** Luồng đối thoại không gián đoạn, mang lại cảm giác về một mối quan hệ duy nhất và đang phát triển.
*   **[FR-02] Bộ nhớ Ngữ cảnh:**
    *   **FR-02.1:** Tự động nhận diện các sự kiện quan trọng trong đời sống và sở thích từ đối thoại.
    *   **FR-02.2:** Duy trì các thông tin đã nhận diện để truy xuất lâu dài và xây dựng mối quan hệ.
*   **[FR-03] Truy xuất Ngữ cảnh:**
    *   **FR-03.1:** Sử dụng các thông tin quá khứ liên quan để hỗ trợ tương tác hiện tại.
    *   **FR-03.2:** Tích hợp các ký ức vào đối thoại một cách tự nhiên.
*   **[FR-04] Tính cách Thích ứng:** Duy trì các sắc thái ngôn ngữ và cộng hưởng văn hoá trong các tương tác.
*   **[FR-05] An toàn Thấu cảm:**
    *   **FR-05.1:** Giám sát thời gian thực các dấu hiệu khủng hoảng hoặc tâm lý tiêu cực cực đoan.
    *   **FR-05.2:** Cung cấp sự hỗ trợ thấu cảm và các nguồn lực giúp đỡ thông qua giọng văn của nhân vật.

---

## 7. Ràng buộc Vận hành
*   **Hiệu quả Tài nguyên:** Tối ưu hóa việc sử dụng tất cả các tài nguyên hệ thống.
*   **Khả năng Mở rộng:** Kiến trúc phải hỗ trợ mức độ tương tác ngày càng tăng của người dùng.

## 8. Chỉ số Thành công
*   **Thấu cảm Định tính:** Người dùng phản hồi cảm thấy "được nghe" và "được hiểu".
*   **Tỷ lệ Giữ chân Phiên:** Người dùng quay lại ứng dụng để tiếp tục hành trình với AmiSoul.
*   **Tính Bền vững:** Duy trì trải nghiệm trong ranh giới tài nguyên đã thiết lập.

---

## 9. Quản lý An toàn & Khủng hoảng
*   **Can thiệp bằng Giọng văn Nhân vật:** Sự hỗ trợ khủng hoảng được chuyển tải thông qua tiếng nói của AmiSoul, ưu tiên lắng nghe chủ động.
*   **Tích hợp Nguồn lực Ngữ cảnh:** Các nguồn lực hỗ trợ được gợi ý như những đề xuất nhẹ nhàng và có liên quan.
