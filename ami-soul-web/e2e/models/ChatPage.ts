import { Page, Locator } from '@playwright/test';

export class ChatPage {
  readonly page: Page;
  readonly textarea: Locator;
  readonly sendButton: Locator;
  readonly chatContainer: Locator;
  readonly messageBubbles: Locator;
  readonly typingIndicatorDots: Locator;
  readonly thinkingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.textarea = page.locator('textarea[aria-label="Nội dung tin nhắn"]');
    this.sendButton = page.locator('button[aria-label="Gửi tin nhắn"]');
    this.chatContainer = page.locator('div.flex-1.overflow-y-auto').first();
    this.messageBubbles = page.locator('div[aria-label^="Tin nhắn từ"]');
    this.typingIndicatorDots = page.locator('div[aria-label="Ami đang soạn tin nhắn"]');
    this.thinkingIndicator = page.locator('div:has-text("Ami đang suy nghĩ...")');
  }

  async goto() {
    await this.page.goto('/');
  }

  async sendMessage(text: string) {
    await this.textarea.fill(text);
    await this.sendButton.click();
  }

  async getMessageCount(): Promise<number> {
    return await this.messageBubbles.count();
  }

  async getLastMessageContent(): Promise<string> {
    const lastMessage = this.messageBubbles.last();
    return (await lastMessage.textContent()) || '';
  }

  async isSendButtonEnabled(): Promise<boolean> {
    return await this.sendButton.isEnabled();
  }
}
