# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-offline.spec.ts >> Offline State >> should disable input and update UI when socket disconnects
- Location: e2e\tests\04-offline.spec.ts:4:7

# Error details

```
Error: Test timeout of 30000ms exceeded
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e5]:
    - heading "404" [level=1] [ref=e6]
    - heading "This page could not be found." [level=2] [ref=e8]
```

# Test source

```ts
  1  | import { test, expect } from '../fixtures/test-utils';
  2  | 
  3  | test.describe('Offline State', () => {
  4  |   test('should disable input and update UI when socket disconnects', async ({ page, chatPage, header, setScenario }) => {
  5  |     await chatPage.goto();
  6  |     
  7  |     // 1. Verify initially online
  8  |     await expect(async () => {
  9  |       expect(await header.getStatusColor()).toBe('green');
> 10 |     }).toPass();
     |        ^ Error: Test timeout of 30000ms exceeded
  11 | 
  12 |     // 2. Trigger disconnect via mock server REST API
  13 |     await fetch('http://localhost:3006/disconnect', { method: 'POST' });
  14 | 
  15 |     // 3. Verify Header turns gray
  16 |     await expect(async () => {
  17 |       expect(await header.getStatusColor()).toBe('gray');
  18 |     }).toPass({ timeout: 5000 });
  19 | 
  20 |     // 4. Verify status text
  21 |     expect(await header.getStatusText()).toBe('Đang đợi tín hiệu từ Ami...');
  22 | 
  23 |     // 5. Verify InputArea disabled
  24 |     await expect(chatPage.textarea).toBeDisabled();
  25 |     await expect(chatPage.textarea).toHaveAttribute('placeholder', 'Đang đợi kết nối...');
  26 | 
  27 |     // 6. Optional: Reconnect test? 
  28 |     // If the mock server is just listening, the client will auto-reconnect.
  29 |     // Let's wait for auto-reconnect.
  30 |     await expect(async () => {
  31 |       expect(await header.getStatusColor()).toBe('green');
  32 |     }).toPass({ timeout: 10000 });
  33 | 
  34 |     await expect(chatPage.textarea).toBeEnabled();
  35 |   });
  36 | });
  37 | 
```