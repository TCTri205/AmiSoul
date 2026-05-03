import { test as base } from '@playwright/test';
import { ChatPage } from '../models/ChatPage';
import { Header } from '../models/Header';

type MyFixtures = {
  chatPage: ChatPage;
  header: Header;
  setScenario: (scenario: string) => Promise<void>;
};

export const test = base.extend<MyFixtures>({
  chatPage: async ({ page }, use) => {
    await use(new ChatPage(page));
  },
  header: async ({ page }, use) => {
    await use(new Header(page));
  },
  setScenario: async ({}, use) => {
    await use(async (scenario: string) => {
      await fetch('http://localhost:3006/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
    });
  },
});

export { expect } from '@playwright/test';
