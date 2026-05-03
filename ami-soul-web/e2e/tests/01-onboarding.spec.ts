import { test, expect } from '../fixtures/test-utils';

test.describe('Onboarding & Connection', () => {
  test('should generate device_id and connect to socket on first visit', async ({ page, chatPage, header, setScenario }) => {
    // 1. Clear storage to simulate fresh visit
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 2. Set mock scenario
    await setScenario('onboarding');

    // 3. Verify Header Indicator (Green)
    await expect(async () => {
      expect(await header.getStatusColor()).toBe('green');
    }).toPass({ timeout: 5000 });

    // 4. Verify Status Text
    const statusText = await header.getStatusText();
    expect(statusText).toBe('Đang lắng nghe');

    // 5. Verify Device ID generation from IndexedDB
    const deviceId = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const req = indexedDB.open('AmiSoulDB');
        req.onsuccess = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('device')) return resolve(null);
          const tx = db.transaction('device', 'readonly');
          const getReq = tx.objectStore('device').get('device_id');
          getReq.onsuccess = () => resolve(getReq.result);
        };
        req.onerror = () => resolve(null);
      });
    });
    expect(deviceId).toMatch(/^[0-9a-f-]{36}$/i); // UUID v4 format
  });
});
