import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('ana adres yönetim ekranına yönlendirir', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    await expect(page).toHaveTitle(/TKMBS İçerik Yönetimi/)
  })
})
