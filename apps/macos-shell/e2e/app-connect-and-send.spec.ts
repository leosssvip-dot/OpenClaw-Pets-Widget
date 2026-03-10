import { expect, test } from '@playwright/test';
import { startMockOpenClawServer } from './fixtures/mock-openclaw-server';

test('connects to a mock gateway and sends a quick message', async ({ page }) => {
  const server = await startMockOpenClawServer();

  try {
    await page.goto('/');
    await page.getByText('Add Gateway').click();
    await page.getByLabel('Gateway URL').fill('http://127.0.0.1:4318');
    await page.getByRole('button', { name: 'Connect' }).click();
    await page.getByRole('button', { name: /Scout/i }).click();
    await page.getByLabel('Message').fill('Prepare a handoff note');
    await page.getByText('Send').click();

    const resultCard = page.getByRole('article');

    await expect(resultCard.getByText('Prepare a handoff note')).toBeVisible();
    await expect(resultCard.getByText('Done')).toBeVisible();
  } finally {
    await server.close();
  }
});
