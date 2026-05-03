import { Page, Locator } from '@playwright/test';

export class Header {
  readonly page: Page;
  readonly statusIndicator: Locator;
  readonly statusText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusIndicator = page.locator('header .w-1\\.5.h-1\\.5.rounded-full');
    this.statusText = page.locator('header span.text-\\[10px\\]');
  }

  async getStatusColor(): Promise<string> {
    const classList = await this.statusIndicator.getAttribute('class');
    if (classList?.includes('bg-green-500')) return 'green';
    if (classList?.includes('bg-yellow-500')) return 'yellow';
    if (classList?.includes('bg-gray-500')) return 'gray';
    return 'unknown';
  }

  async getStatusText(): Promise<string> {
    return (await this.statusText.textContent()) || '';
  }
}
