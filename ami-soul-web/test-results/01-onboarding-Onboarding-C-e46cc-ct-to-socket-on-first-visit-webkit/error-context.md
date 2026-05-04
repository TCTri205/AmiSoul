# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-onboarding.spec.ts >> Onboarding & Connection >> should generate device_id and connect to socket on first visit
- Location: e2e\tests\01-onboarding.spec.ts:4:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "green"
Received: "gray"

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: A
        - generic [ref=e8]:
          - heading "Ami" [level=1] [ref=e9]
          - generic [ref=e10]: Đang đợi tín hiệu từ Ami...
      - button "Cài đặt" [ref=e11]:
        - img [ref=e12]
    - generic [ref=e16]:
      - button "Thêm tệp đính kèm" [disabled] [ref=e17]:
        - img [ref=e18]
      - textbox "Nội dung tin nhắn" [disabled] [ref=e19]:
        - /placeholder: Đang đợi kết nối...
      - button "Ghi âm tin nhắn" [disabled] [ref=e21]:
        - img [ref=e22]
```

# Test source

```ts
  1  | import { test, expect } from '../fixtures/test-utils';
  2  | 
  3  | test.describe('Onboarding & Connection', () => {
  4  |   test('should generate device_id and connect to socket on first visit', async ({ page, chatPage, header, setScenario }) => {
  5  |     // 1. Clear storage to simulate fresh visit
  6  |     await page.goto('/');
  7  |     await page.evaluate(() => localStorage.clear());
  8  |     await page.reload();
  9  | 
  10 |     // 2. Set mock scenario
  11 |     await setScenario('onboarding');
  12 | 
  13 |     // 3. Verify Header Indicator (Green)
  14 |     await expect(async () => {
  15 |       expect(await header.getStatusColor()).toBe('green');
> 16 |     }).toPass({ timeout: 5000 });
     |        ^ Error: expect(received).toBe(expected) // Object.is equality
  17 | 
  18 |     // 4. Verify Status Text
  19 |     const statusText = await header.getStatusText();
  20 |     expect(statusText).toBe('Đang lắng nghe');
  21 | 
  22 |     // 5. Verify Device ID generation from IndexedDB
  23 |     const deviceId = await page.evaluate(async () => {
  24 |       return new Promise((resolve) => {
  25 |         const req = indexedDB.open('AmiSoulDB');
  26 |         req.onsuccess = (e) => {
  27 |           const db = (e.target as IDBOpenDBRequest).result;
  28 |           if (!db.objectStoreNames.contains('device')) return resolve(null);
  29 |           const tx = db.transaction('device', 'readonly');
  30 |           const getReq = tx.objectStore('device').get('device_id');
  31 |           getReq.onsuccess = () => resolve(getReq.result);
  32 |         };
  33 |         req.onerror = () => resolve(null);
  34 |       });
  35 |     });
  36 |     expect(deviceId).toMatch(/^[0-9a-f-]{36}$/i); // UUID v4 format
  37 |   });
  38 | });
  39 | 
```