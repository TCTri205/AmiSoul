# 🤖 AmiSoul - Standard Agent Rules (AGENTS.md)

> Beautiful is better than ugly.
> Explicit is better than implicit.
> Simple is better than complex.
> Complex is better than complicated.
> Flat is better than nested.
> Sparse is better than dense.
> Readability counts.

Dự án AmiSoul tuân thủ các tiêu chuẩn sau để đảm bảo sự thấu cảm và hiệu năng của hệ thống AI.

---

## 🏗️ Kiến trúc & Công nghệ
- **ACE Engine v2.1:** Mọi xử lý hội thoại phải đi qua Stage 0-5.
- **NestJS & TypeScript:** Sử dụng kiến trúc module hóa, dịch vụ hóa.
- **Prisma & Postgres:** Schema-first, migrate bằng CLI, tuyệt đối không sửa DB bằng tay.

## 📐 Quy trình Phát triển (Workflow)
1. **Plan:** Luôn lập kế hoạch thực hiện trước khi viết code.
2. **Code:** KISS, YAGNI, DRY. Giữ file < 200 dòng. Naming: `kebab-case`.
3. **Test:** Phải chạy build/test thành công trước khi hoàn thành.
4. **Git:** Sử dụng Conventional Commits (`feat`, `fix`, `docs`).

## 🛡️ An toàn & Bảo mật
- **Secrets:** Không commit `.env` hoặc API keys. Sử dụng biến môi trường.
- **Destructive:** Luôn hỏi ý kiến người dùng trước khi thực hiện các lệnh xóa dữ liệu (`migrate reset`, `docker down -v`).
- **Privacy:** Tuân thủ các quy tắc bảo mật và quyền riêng tư của người dùng.

## 📝 Quản lý Tài liệu
- **Tickets:** Đồng bộ trạng thái ticket vào `Tickets_Status.md` sau mỗi task.
- **Source of Truth:** Giữ `GEMINI.md` luôn cập nhật với trạng thái dự án.

---

> [!IMPORTANT]
> Mọi chi tiết kỹ thuật sâu hơn, hãy tham khảo [GEMINI.md](./GEMINI.md).
