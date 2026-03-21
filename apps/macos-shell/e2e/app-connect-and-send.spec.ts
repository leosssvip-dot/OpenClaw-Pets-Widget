import { expect, test } from '@playwright/test';
import { startMockOpenClawServer } from './fixtures/mock-openclaw-server';

test('connects to a mock gateway and sends a quick message', async ({ page }) => {
  const server = await startMockOpenClawServer();

  try {
    await page.goto('/');
    await page.getByText('Connect Remote').click();
    await page.getByLabel('Remote Host').fill('gateway.example.com');
    await page.getByLabel('SSH User').fill('testuser');
    await page.getByLabel('Gateway Port').fill('4318');
    await page.getByLabel('Gateway Token').fill('dev-token');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
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
