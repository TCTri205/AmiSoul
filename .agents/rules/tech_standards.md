# AmiSoul Technical Standards (NestJS & Prisma)

Tiêu chuẩn kỹ thuật chi tiết cho Backend AmiSoul.

## 🟢 NestJS Standards
- **Modules:** Chia nhỏ tính năng theo module (Stage-0, Stage-1, etc.).
- **Controllers:** Chỉ xử lý routing và validation (DTo).
- **Services:** Chứa logic nghiệp vụ. Inject `PrismaService` làm singleton.
- **Async:** Sử dụng `async/await` nhất quán, tránh `callback-hell`.

## 🔵 Prisma & DB Standards
- **Schema:** Mọi thay đổi phải nằm trong `prisma/schema.prisma`.
- **Migrations:** `npx prisma migrate dev --name <description>`.
- **Types:** Sử dụng Prisma generated types. Không dùng `any`.
- **Vector:** Định nghĩa các trường embedding với type `Unsupported("vector")`.

## 🟡 Hiệu năng (ACE v2.1)
- **Latency:** Mục tiêu xử lý hội thoại < 3 giây.
- **Caching:** Sử dụng Redis cho các dữ liệu nóng (Vibe, CAL L1).
- **Consolidation:** Xử lý các tác vụ nặng (nén ký ức, DPE) thông qua BullMQ trong Stage 5.
