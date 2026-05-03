import { test, expect } from '../fixtures/test-utils';

test.describe('Offline State', () => {
  test('should disable input and update UI when socket disconnects', async ({ page, chatPage, header, setScenario }) => {
    await chatPage.goto();
    
    // 1. Verify initially online
    await expect(async () => {
      expect(await header.getStatusColor()).toBe('green');
    }).toPass();

    // 2. Trigger disconnect via mock server REST API
    await fetch('http://localhost:3006/disconnect', { method: 'POST' });

    // 3. Verify Header turns gray
    await expect(async () => {
      expect(await header.getStatusColor()).toBe('gray');
    }).toPass({ timeout: 5000 });

    // 4. Verify status text
    expect(await header.getStatusText()).toBe('Đang đợi tín hiệu từ Ami...');

    // 5. Verify InputArea disabled
    await expect(chatPage.textarea).toBeDisabled();
    await expect(chatPage.textarea).toHaveAttribute('placeholder', 'Đang đợi kết nối...');

    // 6. Optional: Reconnect test? 
    // If the mock server is just listening, the client will auto-reconnect.
    // Let's wait for auto-reconnect.
    await expect(async () => {
      expect(await header.getStatusColor()).toBe('green');
    }).toPass({ timeout: 10000 });

    await expect(chatPage.textarea).toBeEnabled();
  });
});
