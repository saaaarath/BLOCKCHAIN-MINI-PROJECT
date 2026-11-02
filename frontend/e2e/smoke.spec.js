import { test, expect } from '@playwright/test';

test('landing page exposes the secure PHR entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Your health data.');
  await expect(page.getByRole('link', { name: /create account/i }).first()).toHaveAttribute('href', '/register');
  await expect(page.getByText('Encrypted end-to-end')).toBeVisible();
});

test('registration route renders accessible validation fields', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  await expect(page.getByLabel('Email address')).toHaveAttribute('type', 'email');
  await expect(page.getByLabel('Wallet address')).toBeVisible();
  await expect(page.getByRole('button', { name: /create account/i })).toBeEnabled();
});

test('protected workspace redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
});
