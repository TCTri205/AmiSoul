# AmiSoul - Người Bạn Đồng Hành AI Thấu Cảm

AmiSoul là một nền tảng người bạn đồng hành ảo được hỗ trợ bởi trí tuệ nhân tạo, được thiết kế để giải quyết tình trạng cô đơn và áp lực tâm lý của giới trẻ Việt Nam. Dự án ưu tiên việc xác thực khái niệm và tạo ra một trải nghiệm cảm xúc sâu sắc, mang đậm bản sắc văn hoá.

## 🚀 Tổng Quan Dự Án

- **Tầm nhìn:** Tạo ra một "Linh hồn số" (Digital Soul) cung cấp sự đồng hành thấu cảm 24/7.
- **Đối tượng mục tiêu:** Giới trẻ Việt Nam (Gen Z/Alpha) đang đối mặt với thử thách tâm lý hoặc sự cô đơn.
- **Trạng thái:** Giai đoạn Phát triển MVP.

---

## 🛠️ Hướng dẫn Phát triển

### Yêu cầu hệ thống
- Node.js v22+
- Docker & Docker Compose

### Cài đặt
1. Sao chép file môi trường:
   ```bash
   cp .env.example .env
   ```
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Khởi chạy cơ sở hạ tầng (DB & Cache):
   ```bash
   docker compose up -d
   ```
4. Chạy ứng dụng ở chế độ phát triển:
   ```bash
   npm run start:dev
   ```

---

## 📂 Cấu Trúc Tài Liệu

Hệ thống tài liệu của dự án được tổ chức thành các nhóm cốt lõi:

### 1. Khởi tạo & Lập kế hoạch (`/docs/init`)
- **[BRD.md](./docs/init/BRD.md):** Tài liệu yêu cầu kinh doanh.
- **[PRD.md](./docs/init/PRD.md):** Tài liệu yêu cầu sản phẩm.

### 2. Thiết kế & Kiến trúc (`/docs/architecture`)
- **[SystemArchitecture.md](./docs/architecture/SystemArchitecture.md):** Bản đồ các thành phần logic.
- **[TechnicalArchitecture.md](./docs/architecture/TechnicalArchitecture.md):** Chi tiết kỹ thuật.

### 3. Quản lý Dự án (`/docs/project_managements`)
- **[Tickets_Status.md](./docs/project_managements/ticket/Tickets_Status.md):** Bảng trạng thái công việc.

---

## 📝 Bản quyền
Dự án hiện đang trong quá trình phát triển.
