---
name: ace_stage_generator
description: Khởi tạo boilerplate cho các Stage mới trong kiến trúc ACE Engine v2.1 (NestJS Module, Service, DTO).
---

# Kỹ năng: ACE Stage Generator

Kỹ năng này giúp nhanh chóng thiết lập cấu trúc cho các tầng nhận thức của AmiSoul.

## 🎯 When to Use
- Khi bắt đầu triển khai một Stage mới (Stage 0-5) theo kiến trúc ACE.
- Khi cần tạo một module tính năng mới tuân thủ chuẩn của dự án.

## 🛠️ How to Use
1. Tạo thư mục module mới trong `src/modules/`.
2. Tạo file `[stage-name].module.ts`, `[stage-name].service.ts`.
3. Tạo thư mục `dto/` và các file `create-[stage-name].dto.ts`.
4. Đăng ký module mới vào `AppModule`.
