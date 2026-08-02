import { test, expect } from '@playwright/test'

test.describe('Setup Wizard', () => {
  test('shows setup wizard when setup is not complete', async ({ page }) => {
    await page.addInitScript(`
      window.__MOCK_DATA__ = { IsSetupComplete: false };
      window.__wailsRuntime = {
        Call: { ByID: async (id) => id === 259807637 ? false : null }
      };
    `)
    await page.goto('/')
    await expect(page.locator('text=One Man Shop')).toBeVisible()
    await expect(page.locator("text=Let's set up your POS system")).toBeVisible()
  })

  test('completes full setup wizard flow', async ({ page }) => {
    await page.addInitScript(`
      window.__MOCK_DATA__ = { IsSetupComplete: false, SaveSettings: undefined };
      window.__wailsRuntime = {
        Call: { ByID: async (id) => {
          if (id === 259807637) return false;
          if (id === 1949631069) return undefined;
          return null;
        }}
      };
    `)
    await page.goto('/')

    // Step 1: Shop Info
    await page.fill('input[placeholder*="Fresh Juice"]', 'My Test Shop')
    await page.click('text=Next')

    // Step 2: UPI Setup
    await expect(page.locator('text=UPI Payment Setup')).toBeVisible()
    await page.fill('input[placeholder*="Ramesh"]', 'Test Owner')
    await page.fill('input[placeholder*="@upi"]', 'test@upi')
    await page.click('text=Next')

    // Step 3: Confirm
    await expect(page.locator('text=Confirm Setup')).toBeVisible()
    await expect(page.locator('text=My Test Shop')).toBeVisible()
    await expect(page.locator('text=test@upi')).toBeVisible()

    // Finish
    await page.click('text=Start Selling')
  })

  test('Next button disabled when required fields empty', async ({ page }) => {
    await page.addInitScript(`
      window.__wailsRuntime = { Call: { ByID: async () => false } };
    `)
    await page.goto('/')
    await expect(page.locator('text=Next')).toBeDisabled()
  })

  test('can navigate back between steps', async ({ page }) => {
    await page.addInitScript(`
      window.__wailsRuntime = { Call: { ByID: async () => false } };
    `)
    await page.goto('/')
    await page.fill('input[placeholder*="Fresh Juice"]', 'Test Shop')
    await page.click('text=Next')
    await expect(page.locator('text=UPI Payment Setup')).toBeVisible()
    await page.click('text=Back')
    await expect(page.locator('text=Shop Information')).toBeVisible()
  })

  test('Back button disabled on first step', async ({ page }) => {
    await page.addInitScript(`
      window.__wailsRuntime = { Call: { ByID: async () => false } };
    `)
    await page.goto('/')
    await expect(page.locator('text=Back')).toBeDisabled()
  })
})
