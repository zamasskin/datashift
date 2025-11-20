import { test, expect } from '@playwright/test'

test.describe('Login page smoke', () => {
  test('renders login form with email and password', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Добро пожаловать' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Пароль')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Авторизоваться' })).toBeVisible()
  })
})
