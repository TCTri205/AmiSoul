# Kiến trúc Frontend Chi tiết (Frontend Architecture) - AmiSoul

**Phiên bản:** ACE v2.1 (v3.0.0)
**Cập nhật lần cuối:** 2026-05-03

Tài liệu này định nghĩa tiêu chuẩn kỹ thuật, cấu trúc thành phần, quản lý trạng thái và phương pháp tiếp cận UI/UX để xây dựng lớp Frontend **"Safe Harbor"** cho nền tảng AmiSoul — một giao diện nhắn tin thân thiện, tựa Messenger, tập trung hoàn toàn vào kết nối cảm xúc 1:1 giữa người dùng và AI.

> [!IMPORTANT]
> **Phạm vi MVP:** Giao diện được thiết kế cho tương tác **1:1 (một User — một AI)** qua kênh **text chat** trên nền Web (Mobile-first). Voice Chat, Group Chat nằm ngoài phạm vi.

---

## 1. Tổng quan Công nghệ (Frontend Stack)

| Lớp (Layer) | Công nghệ | Mục đích |
| :--- | :--- | :--- |
| **Core Framework** | **Next.js 14+ (App Router)** | Server Components giảm tải client, tối ưu hiệu suất khởi tạo (First Load). |
| **Styling** | **Tailwind CSS** | Utility-first, linh hoạt tạo bảng màu Pastel tùy chỉnh và Dark Mode. |
| **UI Components** | **Radix UI / Shadcn/ui** | Headless, accessible (a11y) components, tùy biến giao diện hoàn toàn. |
| **Animation** | **Framer Motion** | Micro-animations mượt mà cho Message Bubbles, VibeBackground, transitions. |
| **State Management** | **Zustand** | Store cực nhẹ, selector-based → tránh re-render DOM không cần thiết. |
| **Real-time Comms** | **Socket.io-client** | Kết nối thời gian thực, truyền nhận text streaming và tín hiệu Vibe. |
| **Markdown Render** | **React Markdown + Custom Plugins** | Parse phản hồi LLM, bóc tách Action text `*...*` thành component riêng. |
| **Local Storage** | **IndexedDB (via idb)** | Lưu trữ tin nhắn offline, Device_ID, và cache phiên. |
| **E2E Testing** | **Playwright** | Kiểm thử tự động trên Chromium và Webkit. |

---

## 2. Quản lý Trạng thái (State Management)

Kiến trúc State được phân tách rõ ràng để đảm bảo hiệu suất 60fps trên thiết bị di động:

### 2.1. Global UI State (Zustand)
Sử dụng Zustand với **selector pattern** để chỉ re-render component đăng ký đúng slice cần thiết:

| Store | Dữ liệu | Ghi chú |
| :--- | :--- | :--- |
| `useChatStore` | Danh sách tin nhắn, trạng thái `isStreaming`, `isTyping`, `streamingChunks` | Cập nhật tần suất cao (mỗi chunk stream). |
| `useVibeStore` | `Session_Vibe` (`positive`/`neutral`/`stressed`), `Bonding_Score`, `connectionStatus` | Trigger thay đổi CSS Variables cho `VibeBackground`. |
| `useUIStore` | Trạng thái menu, modal, thông báo hệ thống, `isRecordingVoice` | Cập nhật ít, ảnh hưởng layout. |

### 2.2. Real-time Connection State (React Context)
- **`SocketProvider`:** Context bao bọc toàn bộ App, chứa instance Socket.io duy nhất.
- **Lý do dùng Context thay vì Zustand:** Socket instance là singleton, không cần selector optimization. Context đảm bảo lifecycle gắn với App mount/unmount.
- **Cung cấp methods:** `sendMessage()`, `sendInterrupt()`, `onMessage()`, `onVibeUpdate()`, `onConnectionChange()`.
- **Auto-reconnect:** Tích hợp exponential backoff (1s → 2s → 4s → max 30s). Mỗi lần reconnect thành công, sync lại tin nhắn bị mất từ LocalCache.

### 2.3. Luồng Dữ liệu (Data Flow)

```
Socket Event → SocketProvider → Zustand Store → React Component (re-render)
                                      ↓
                              IndexedDB (persist)
```

- **Tin nhắn đến (stream):** `socket.on('stream_chunk')` → `useChatStore.appendChunk()` → `MessageBubble` re-render nội dung streaming.
- **Vibe update:** `socket.on('vibe_update')` → `useVibeStore.setVibe()` → `VibeBackground` chuyển gradient (CSS transition 2s).
- **Connection change:** `socket.on('disconnect')` → `useVibeStore.setConnectionStatus('disconnected')` → Header Indicator + Input Area phản ứng.

---

## 3. Kiến trúc UI & Layout (Mobile-First Messenger)

Giao diện được thiết kế như một **ứng dụng nhắn tin toàn màn hình**, tối ưu "One-handed usage", lấy cảm hứng từ Messenger/iMessage nhưng mang phong cách "Quiet & Intimate" riêng biệt.

### 3.1. Wireframe Layout

```
┌─────────────────────────────────┐
│  Header (48px)                  │
│  [← Back]  "Ami" ● [⚙️]       │
├─────────────────────────────────┤
│                                 │
│  VibeBackground (position:fixed)│
│  ┌─────────────────────────┐    │
│  │  Chat Container         │    │
│  │  (overflow-y: auto)     │    │
│  │                         │    │
│  │  [AI Bubble]            │    │
│  │          [User Bubble]  │    │
│  │  [AI Bubble + Action]   │    │
│  │          [User Bubble]  │    │
│  │  [AI Typing Indicator]  │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│  Input Area (position:sticky)   │
│  [🎤] [   Text Input...   ] [➤]│
└─────────────────────────────────┘
```

### 3.2. Chi tiết Vùng hiển thị

| Vùng | Đặc tả kỹ thuật |
| :--- | :--- |
| **Viewport** | `height: 100dvh` (khắc phục Safari mobile). Body `overflow: hidden`, chỉ Chat Container cuộn. |
| **Header** | Cố định trên cùng (48px). Hiển thị: Tên "Ami", **Breathing Indicator** (chấm tròn nhỏ nhấp nháy = online, xám = offline, vàng = reconnecting), nút Settings (⚙️). |
| **VibeBackground** | `position: fixed; z-index: 0`. CSS Mesh Gradient với `animation: drift 20s ease-in-out infinite`. Màu thay đổi theo `useVibeStore` qua CSS custom properties (`--vibe-color-1`, `--vibe-color-2`, `--vibe-color-3`). Transition: `2s ease-in-out`. |
| **Chat Container** | `flex: 1; overflow-y: auto; z-index: 1`. Background: `transparent` (để VibeBackground xuyên qua). Auto-scroll khi có tin mới (trừ khi user đang cuộn lên đọc lịch sử — phát hiện bằng `scrollTop + clientHeight < scrollHeight - 100px`). |
| **Input Area** | `position: sticky; bottom: 0`. Chứa: Nút Microphone (🎤), TextArea auto-resize (max 4 dòng), nút Gửi (➤). Trên mobile: xử lý `visualViewport` resize khi bàn phím ảo xuất hiện để không bị che. |

### 3.3. Bảng màu Vibe (Vibe Color Mapping)

| Session Vibe | Gradient chính | Mô tả cảm xúc |
| :--- | :--- | :--- |
| `positive` | Pastel hồng → Lavender → Peach | Ấm áp, vui vẻ |
| `neutral` | Pastel xanh nhạt → Cream → Lilac | Bình yên, trung tính |
| `stressed` | Pastel tím trầm → Slate → Dusty blue | Trầm lắng, lo lắng |
| `crisis` | Soft blue → Pale grey | Nhẹ nhàng, an toàn (KHÔNG dùng đỏ/cam gây kích động) |
| `offline` | Grey → Muted lavender | Trạng thái ngủ/đợi |

> [!NOTE]
> **Quy tắc chuyển màu (Transition Rule):** Việc thay đổi từ Vibe này sang Vibe khác **phải diễn ra từ từ, mượt mà và chậm rãi (Transition tối thiểu 3-5 giây)**. Tuyệt đối không được thay đổi màu cái "bụp" ngay lập tức để tránh làm giật mình và phá vỡ luồng cảm xúc đang tĩnh lặng của người dùng.
> 
> **Dark Mode:** Tất cả gradient giữ nguyên hue nhưng giảm lightness 30-40%, tăng saturation nhẹ để giữ cảm giác ấm trên nền tối.

### 3.4. Component MessageBubble

| Thuộc tính | User Bubble | AI Bubble |
| :--- | :--- | :--- |
| **Vị trí** | Căn phải | Căn trái |
| **Màu nền** | Semi-transparent white/dark (glassmorphism nhẹ) | Semi-transparent, hơi đậm hơn User |
| **Bo góc** | `rounded-2xl rounded-br-md` | `rounded-2xl rounded-bl-md` |
| **Animation xuất hiện** | Framer Motion: `fade-in + slide-up` (100ms) | Framer Motion: `fade-in + slide-left` (150ms) |
| **Streaming** | Không áp dụng | Text render dần theo chunk. Cursor nhấp nháy ở cuối. |
| **Timestamp** | Hiển thị khi tap/hover | Hiển thị khi tap/hover |

### 3.5. Hiển thị Hành động AI (Action Rendering)
Khi LLM trả về hành động trong ngoặc hoa thị (VD: `*mỉm cười nhẹ*`, `*lắng nghe chăm chú*`) — theo đặc tả T4.6:
- Custom plugin trong React Markdown bóc tách text `*...*` ra khỏi luồng nội dung chính.
- Render thành **ActionTag component**: font-size nhỏ hơn (0.75em), màu nhạt (text-muted), italic, kèm icon tương ứng nếu có (😊, 👀, 🤗).
- Vị trí: Inline với text, không tách dòng riêng (giống cách Messenger hiển thị reaction nhỏ gọn).

### 3.6. Typing Indicator
- Khi Backend bắt đầu xử lý (nhận event `processing_start`): Hiển thị 3 chấm nhảy (bouncing dots animation) trong AI bubble placeholder.
- Khi chunk đầu tiên đến: Thay thế dots bằng text streaming.
- **Hiệu ứng UX "Đã xem":** Ngay khi user gửi tin, hiển thị trạng thái "Đã xem ✓" dưới tin nhắn (trước khi AI bắt đầu gõ), tạo cảm giác tức thì như Messenger.

---

## 4. Cơ chế Onboarding & Định danh (Auth-less Onboarding)

Đáp ứng tiêu chí SRS: *"Tham gia tức thì, không sử dụng biểu mẫu tĩnh, tìm hiểu qua đối thoại tự nhiên."*

### 4.1. Luồng Định danh

```
Lần đầu truy cập
    ↓
Sinh Device_ID (UUIDv4) → lưu localStorage
    ↓
FE gửi Device_ID qua Socket handshake auth
    ↓
Backend tạo Guest User (hoặc nhận diện Device_ID cũ)
    ↓
Cấp JWT Guest Token → lưu vào memory (KHÔNG localStorage để bảo mật)
    ↓
JWT tự động gắn vào mỗi kết nối Socket (header auth)
```

### 4.2. Nâng cấp Tài khoản (Progressive Account Link)
- **Trigger:** Khi Bonding_Score đạt ngưỡng (≥ 20 — tức Acquaintance), Ami chủ động gợi ý nhẹ nhàng trong hội thoại: *"Mình muốn nhớ bạn mãi, bạn có muốn lưu lại ký ức của mình không?"*
- **UI:** Bottom Sheet mở lên (Framer Motion slide-up), chứa input Email/Phone + OTP xác thực. Không redirect, không rời trang chat.
- **Mapping:** Backend liên kết `Device_ID` → `User_ID` chính thức. Toàn bộ CMA/DPE/Bonding của Guest được giữ nguyên.

### 4.3. Khôi phục Phiên (Session Persistence)
- **Refresh/F5:** Tin nhắn được load từ IndexedDB trước, sau đó sync delta từ Backend qua Socket.
- **Đổi thiết bị (sau khi có Account):** Đăng nhập bằng Email/OTP → Backend trả về lịch sử chat gần nhất (20 tin cuối) + Session_Vibe hiện tại.

---

## 5. Xử lý Luồng Nhắn tin (Message Flow — FE Side)

### 5.1. Gửi tin nhắn
1. User nhập text → nhấn Enter/nút Gửi.
2. Tin nhắn hiển thị **ngay lập tức** trong Chat Container (Optimistic UI) với trạng thái `sending`.
3. Gửi qua Socket: `socket.emit('user_message', { content, timestamp })`.
4. Backend xác nhận (`message_ack`) → cập nhật trạng thái thành `sent` → hiển thị "Đã xem ✓".
5. Lưu tin nhắn vào IndexedDB.

### 5.2. Nhận phản hồi AI (Streaming)
1. Nhận `processing_start` → hiển thị Typing Indicator.
2. Nhận `stream_chunk` liên tục → `useChatStore.appendChunk(chunk)` → MessageBubble render dần.
3. Nhận `stream_end` → đánh dấu tin nhắn hoàn tất, lưu IndexedDB.
4. Nhận `vibe_update` (đi kèm hoặc sau stream_end) → `useVibeStore.setVibe()` → VibeBackground chuyển màu.

### 5.3. Cắt ngang hội thoại (Preemption — theo ACE Stage 0)
Nếu user gửi tin nhắn MỚI khi Ami đang stream:
1. FE gửi `socket.emit('interrupt')` → Backend hủy stream hiện tại.
2. MessageBubble đang stream: **Fade-out đoạn cuối** (opacity giảm dần), append `...` vào cuối text.
3. Tin nhắn mới của user xuất hiện bình thường bên dưới.
4. AI bắt đầu stream phản hồi mới (với context kết hợp).

> [!NOTE]
> Theo ACE_Core_Design: Tối đa **2 lần preempt liên tiếp**. Nếu > 2 → Backend chuyển Batch Mode, FE nhận `batch_mode_start` → hiển thị notice nhẹ: *"Ami đang đọc hết tin của bạn..."*

### 5.4. Reaction/Emoji trên tin nhắn
- User có thể long-press (mobile) hoặc hover (desktop) lên tin nhắn AI để thả reaction (❤️, 😢, 😡, 😂, 👍).
- FE gửi `socket.emit('message_reaction', { messageId, emoji })`.
- Backend cập nhật Session_Vibe ngầm (không trigger Pipeline mới) — theo ACE Stage 0.
- Reaction hiển thị nhỏ gọn dưới góc bubble (giống Messenger).

### 5.5. Reply tin nhắn cũ
- User có thể swipe-right (mobile) hoặc hover + click Reply trên một tin nhắn cũ.
- Input Area hiển thị preview tin nhắn được reply (thanh nhỏ phía trên TextArea).
- Gửi kèm `reply_to_message_id` → Backend đưa tin nhắn gốc vào context (theo ACE Stage 0).

---

## 6. Xử lý Lỗi & Edge Cases (Resilience UI)

Tuân thủ nguyên tắc **"Non-intrusive Error Handling"** — không báo lỗi kỹ thuật, mọi thứ phải nhẹ nhàng và phù hợp với triết lý Safe Harbor.

### 6.1. Mất kết nối (Offline State)
- **KHÔNG hiển thị popup/toast "Lỗi Mạng".**
- `VibeBackground` chuyển dần sang tông `offline` (Grey → Muted lavender), transition 3s.
- Header Indicator: chấm tròn chuyển xám, hiển thị dòng chữ mờ: *"Đang đợi tín hiệu từ Ami..."*
- Input Box: vẫn cho phép gõ nhưng nút Gửi disabled (mờ). Tin nhắn queue trong IndexedDB, auto-send khi reconnect.

### 6.2. AI phản hồi chậm (Timeout)
- Nếu > 6s không nhận `stream_chunk` sau `processing_start`:
- Typing Indicator chuyển text: *"Ami đang suy nghĩ..."* (thay cho dots nhảy).
- Nếu > 15s: Hiển thị tin nhắn hệ thống nhẹ nhàng: *"Ami hơi bận, thử lại sau chút nha 💤"* + nút "Gửi lại".

### 6.3. Hỗ trợ Media Input
- **Microphone:** Nút 🎤 ở Input Area. Giữ/chạm → hiển thị Voice Visualizer (waveform animation). Thả → encode audio (Blob) gửi qua Socket. Backend chạy STT (Stage 0).
- **Ảnh:** Nút 📷 (ẩn trong menu "+"). Chọn ảnh → hiển thị preview thumbnail trong Input Area → gửi Base64/Blob qua Socket. Backend chạy Image Captioning (Stage 0).
- **Sticker/Emoji đơn độc:** Gửi như tin nhắn text thông thường. Backend nhận diện và ánh xạ sang Sentiment_Signal.

### 6.4. Crisis UI (Khi Backend phát hiện tín hiệu khủng hoảng)
- FE nhận event `crisis_response` → MessageBubble AI hiển thị với:
  - Viền nhẹ màu xanh dương (calming, KHÔNG đỏ).
  - Nội dung chứa thông tin hotline (clickable: `tel:0912233300`).
  - VibeBackground chuyển sang tông `crisis` (Soft blue → Pale grey).

---

## 7. Accessibility & Responsive (a11y)

### 7.1. Breakpoints

| Breakpoint | Kích thước | Hành vi |
| :--- | :--- | :--- |
| **Mobile** | `< 640px` | Full-screen chat, ẩn sidebar (nếu có), font-size 16px (tránh auto-zoom iOS). |
| **Tablet** | `640px - 1024px` | Chat container max-width 600px, căn giữa. |
| **Desktop** | `> 1024px` | Chat container max-width 680px, căn giữa, VibeBackground mở rộng toàn màn hình. |

### 7.2. Touch Targets
- Tất cả nút tương tác: tối thiểu **44×44px** (theo WCAG).
- Input Area: padding đủ rộng để tránh miss-tap giữa Microphone và TextArea.

### 7.3. Keyboard Navigation
- `Enter` = Gửi tin nhắn. `Shift+Enter` = Xuống dòng.
- `Escape` = Đóng modal/Bottom Sheet.
- Tab navigation cho tất cả interactive elements.

### 7.4. Screen Reader
- Mỗi MessageBubble có `aria-label`: `"Tin nhắn từ [User/Ami]: [nội dung]"`.
- Typing Indicator: `aria-live="polite"` với text `"Ami đang gõ..."`.
- VibeBackground: `aria-hidden="true"` (decorative).

---

## 8. Cấu trúc Thư mục (Directory Structure)

```
ami-soul-web/                     # Dự án FE tách biệt khỏi Backend NestJS
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout (SocketProvider, VibeBackground)
│   │   ├── page.tsx              # Main chat page
│   │   └── globals.css           # Tailwind base + CSS custom properties (Vibe colors)
│   ├── components/
│   │   ├── ui/                   # Shadcn/UI base (Button, Input, Sheet, Dialog)
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx # Scrollable message list + auto-scroll logic
│   │   │   ├── MessageBubble.tsx # User/AI bubble + streaming + action rendering
│   │   │   ├── InputArea.tsx     # TextArea + Send + Mic + Attachment buttons
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── ReplyPreview.tsx  # Preview bar when replying to old message
│   │   │   └── ReactionPicker.tsx
│   │   ├── vibe/
│   │   │   ├── VibeBackground.tsx  # Mesh gradient + drift animation
│   │   │   └── HapticFeedback.tsx  # Vibration API + soft notification sound
│   │   └── layout/
│   │       ├── Header.tsx          # App header + breathing indicator
│   │       ├── SafeAreaWrapper.tsx  # 100dvh + keyboard handling
│   │       └── AccountLinkSheet.tsx # Bottom sheet for Email/OTP upgrade
│   ├── providers/
│   │   └── SocketProvider.tsx    # React Context for Socket.io singleton
│   ├── store/
│   │   ├── useChatStore.ts       # Messages, streaming state
│   │   ├── useVibeStore.ts       # Session_Vibe, Bonding_Score, connectionStatus
│   │   └── useUIStore.ts         # Modals, menus, recording state
│   ├── hooks/
│   │   ├── useAutoScroll.ts      # Smart auto-scroll (pause when reading history)
│   │   ├── useMicrophone.ts      # MediaRecorder API wrapper
│   │   └── useLocalCache.ts      # IndexedDB read/write for messages
│   ├── lib/
│   │   ├── socket.ts             # Socket.io client config (URL, auth, reconnect)
│   │   ├── markdown-plugins.ts   # Custom React Markdown plugin for *action* parsing
│   │   ├── cache.ts              # IndexedDB operations (idb library)
│   │   └── utils.ts              # Helpers (formatTime, generateDeviceId, etc.)
│   └── types/
│       ├── message.ts            # Message, StreamChunk, Reaction interfaces
│       ├── vibe.ts               # VibeState, VibeColor enums
│       └── socket-events.ts      # Socket event name constants & payload types
├── public/
│   └── sounds/
│       └── soft-notification.mp3 # Haptic notification sound
├── tailwind.config.ts            # Custom Pastel palette + Dark Mode config
├── next.config.ts
├── package.json
└── playwright.config.ts          # E2E test config (Chromium + Webkit)
```

---

## 9. Tài liệu Tham chiếu

- **[Đặc tả Yêu cầu (SRS)](./SRS.md)** — Phần 4.0: UI/UX
- **[Lựa chọn Công nghệ (Tech Stack)](./TechStack.md)** — Frontend stack
- **[Thiết kế Hệ thống (ACE Core Design)](./ACE_Core_Design.md)** — Stage 0 (Message Flow), Stage 4 (Vibe Monitor)
- **[Kiến trúc Kỹ thuật (Technical Architecture)](./TechnicalArchitecture.md)** — Luồng Socket, State Management
- **[Kịch bản Nhắn tin (Messaging Scenarios)](../method/messaging_scenarios.md)** — Tất cả edge cases FE cần xử lý
- **[EPIC-05: Safe Harbor Frontend](../project_managements/epic/EPIC-05_Safe_Harbor_Frontend.md)** — Epic gốc
