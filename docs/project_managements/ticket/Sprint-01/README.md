# Sprint-01: Foundation & Real-time Aggregator

## 🎯 Mục tiêu Sprint
Thiết lập nền tảng kỹ thuật vững chắc cho hệ thống AmiSoul, bao gồm hạ tầng Backend (NestJS, PostgreSQL, Redis), cấu hình Docker, và triển khai Stage 0 (Aggregator & Preemption) để xử lý luồng dữ liệu thời gian thực.

## 📋 Danh sách Ticket

| ID | Tên Tác vụ | Trạng thái | Độ ưu tiên |
| :--- | :--- | :--- | :--- |
| [T1.1](T1.1_Init_Boilerplate_Docker.md) | Khởi tạo Boilerplate & Docker | ✅ Done | P0 |
| [T1.2](T1.2_Prisma_Schema_Design.md) | Thiết kế Schema Prisma | ✅ Done | P0 |
| [T1.3](T1.3_Socket_Gateway_JWT.md) | Xây dựng Socket Gateway | ✅ Done | P1 |
| [T1.4](T1.4_Message_Aggregator_Service.md) | Triển khai MessageAggregatorService | ✅ Done | P1 |
| [T1.5](T1.5_Timer_Debounce_Logic.md) | Logic Timer Debounce | ✅ Done | P1 |
| [T1.6](T1.6_AbortSignal_Preemption.md) | Tích hợp AbortSignal | ✅ Done | P2 |
| [T1.7](T1.7_Unit_Test_Aggregator.md) | Unit Test Aggregator | ✅ Done | P2 |

## 🔗 Liên kết Hữu ích
- **Epic gốc:** [[EPIC-01] Foundation & Real-time Aggregator](../epic/EPIC-01_Foundation_Aggregator.md)
- **Kiến trúc:** [TechnicalArchitecture.md](../../architecture/TechnicalArchitecture.md)
