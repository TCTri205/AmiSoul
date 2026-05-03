import { test, expect } from '../fixtures/test-utils';

test.describe('Preemption (Interrupt)', () => {
  test('should interrupt current stream when new message is sent', async ({ chatPage, setScenario }) => {
    await chatPage.goto();
    await setScenario('preemption');

    // 1. Send first message
    await chatPage.sendMessage('Kể một câu chuyện dài');

    // 2. Wait for streaming to start
    const firstAI = chatPage.messageBubbles.nth(1);
    await expect(firstAI).toBeVisible({ timeout: 5000 });
    await expect(firstAI).toContainText('Đây là đoạn văn dài', { timeout: 5000 });

    // 3. Send second message while still streaming
    await chatPage.sendMessage('Dừng lại, nói cái khác đi');

    // 4. Verify first AI message is interrupted
    // In useChatStore.finalizeStream(id, true), it appends '...'
    await expect(firstAI).toContainText('...', { timeout: 2000 });
    
    // Verify it has interrupted style (opacity-60 grayscale-[0.2])
    const firstAIContainer = firstAI; // The selector matches the motion.div with class
    await expect(firstAIContainer).toHaveClass(/opacity-60/);

    // 5. Verify second AI message starts (mock server switches back to default/onboarding text if not handled, but we just check visibility)
    // For this test, let's just ensure a new AI bubble appears
    await expect(chatPage.messageBubbles).toHaveCount(4); // User1, AI1, User2, AI2
  });
});
