import { test, expect } from '../fixtures/test-utils';

test.describe('Message Streaming', () => {
  test('should stream AI response correctly', async ({ chatPage, setScenario }) => {
    await chatPage.goto();
    await setScenario('streaming');

    // 1. Send message
    const userMsg = 'Kiểm tra streaming';
    await chatPage.sendMessage(userMsg);

    // 2. Verify user bubble
    await expect(chatPage.messageBubbles.first()).toContainText(userMsg);

    // 3. Verify Thinking state
    await expect(chatPage.typingIndicatorDots).toBeVisible();

    // 4. Verify Streaming starts
    await expect(chatPage.messageBubbles.nth(1)).toBeVisible({ timeout: 10000 });
    
    // 5. Verify Content grows (wait for a specific word that mock server sends)
    await expect(chatPage.messageBubbles.nth(1)).toContainText('phản hồi từ mock server', { timeout: 10000 });

    // 6. Verify streaming cursor disappears (implicitly by checking completion)
    // In our MessageBubble, the cursor is a motion.span. Let's check for its absence eventually.
    const cursor = chatPage.messageBubbles.nth(1).locator('span.inline-block.w-1\\.5.h-4');
    await expect(cursor).toBeHidden({ timeout: 15000 });
  });
});
